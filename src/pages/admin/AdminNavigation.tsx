import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Loader2,
  Layout,
  Eye,
  EyeOff,
  GripVertical,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SITE_NAV_ITEMS, type NavSections, type NavOrder, type NavSection } from "@/lib/navigation";

interface NavItem {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  section: NavSection;
}

// Use the shared nav registry as source-of-truth
const allNavItems: NavItem[] = SITE_NAV_ITEMS.map((i) => ({
  key: i.key,
  label: i.label,
  description: i.description,
  icon: i.icon,
  section: i.defaultSection,
}));

interface NavSettings {
  [key: string]: boolean;
}

// Stored in site_settings as JSON
// - nav_order: { [navKey]: index }
// - nav_sections: { [navKey]: "main" | "community" }

function SortableNavItem({
  item,
  isEnabled,
  onToggle,
  section,
  onSectionChange,
}: {
  item: NavItem;
  isEnabled: boolean;
  onToggle: () => void;
  section: NavSection;
  onSectionChange: (section: NavSection) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
        isEnabled ? "bg-primary/5 border-primary/20" : "bg-secondary/30 border-border/50 opacity-60"
      } ${isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center gap-4">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="p-2 rounded-lg bg-secondary/50">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{item.label}</p>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={section} onValueChange={(v) => onSectionChange(v as NavSection)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main">Main</SelectItem>
            <SelectItem value="community">Community</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
          {isEnabled ? "Visible" : "Hidden"}
        </Badge>
        <Switch checked={isEnabled} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}

export default function AdminNavigation() {
  const [settings, setSettings] = useState<NavSettings>({});
  const [order, setOrder] = useState<NavOrder>({});
  const [sections, setSections] = useState<NavSections>({});
  const [orderedItems, setOrderedItems] = useState<NavItem[]>(allNavItems);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;

      const loadedSettings: NavSettings = {};
      let loadedOrder: NavOrder = {};
      let loadedSections: NavSections = {};

      // Default all items to visible
      allNavItems.forEach((item) => {
        loadedSettings[item.key] = true;
      });

      data?.forEach((row) => {
        if (row.key === "nav_order" && row.value) {
          loadedOrder = row.value as NavOrder;
        } else if (row.key === "nav_sections" && row.value) {
          loadedSections = row.value as NavSections;
        } else if (row.key.startsWith("nav_") && row.key.endsWith("_visible")) {
          loadedSettings[row.key] = row.value === true || row.value === "true";
        }
      });

      setSettings(loadedSettings);
      setOrder(loadedOrder);
      setSections(loadedSections);

      // Apply order + stored sections
      const sorted = [...allNavItems]
        .map((item) => ({ ...item, section: loadedSections[item.key] || item.section }))
        .sort((a, b) => {
          const orderA = loadedOrder[a.key] ?? 999;
          const orderB = loadedOrder[b.key] ?? 999;
          return orderA - orderB;
        });
      setOrderedItems(sorted);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedItems((items) => {
      const oldIndex = items.findIndex((item) => item.key === active.id);
      const newIndex = items.findIndex((item) => item.key === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      // Update order state
      const newOrder: NavOrder = {};
      newItems.forEach((item, index) => {
        newOrder[item.key] = index;
      });
      setOrder(newOrder);
      
      return newItems;
    });
  };

  const saveSettings = async () => {
    if (!isAdmin) {
      toast({ title: "Only admins can change settings", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      // Save visibility settings
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }

      // Save order
      const { error: orderError } = await supabase
        .from("site_settings")
        .upsert({ key: "nav_order", value: order }, { onConflict: "key" });
      if (orderError) throw orderError;

      // Save sections
      const { error: sectionError } = await supabase
        .from("site_settings")
        .upsert({ key: "nav_sections", value: sections }, { onConflict: "key" });
      if (sectionError) throw sectionError;

      toast({ title: "Navigation settings saved" });
    } catch (error: any) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAll = (enabled: boolean) => {
    const newSettings = { ...settings };
    allNavItems.forEach((item) => {
      newSettings[item.key] = enabled;
    });
    setSettings(newSettings);
  };

  const itemsWithSections = orderedItems.map((i) => ({ ...i, section: sections[i.key] || i.section }));
  const mainItems = itemsWithSections.filter((item) => item.section === "main");
  const communityItems = itemsWithSections.filter((item) => item.section === "community");
  const enabledCount = Object.values(settings).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSettingsNav />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Navigation Settings</h2>
          <p className="text-muted-foreground">
            Control which sections appear in the sidebar and their order
          </p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => toggleAll(true)} className="gap-2">
          <Eye className="w-4 h-4" />
          Show All
        </Button>
        <Button variant="outline" size="sm" onClick={() => toggleAll(false)} className="gap-2">
          <EyeOff className="w-4 h-4" />
          Hide All
        </Button>
        <Badge variant="outline" className="ml-auto">
          {enabledCount}/{allNavItems.length} visible
        </Badge>
      </div>

      <div className="grid gap-6">
        {/* Main Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10">
              <Layout className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Main Navigation</h3>
              <p className="text-sm text-muted-foreground">
                Drag to reorder, toggle to show/hide
              </p>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={mainItems.map((item) => item.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {mainItems.map((item) => (
                  <SortableNavItem
                    key={item.key}
                    item={item}
                    isEnabled={settings[item.key] ?? true}
                    section={(sections[item.key] || item.section) as NavSection}
                    onSectionChange={(sec) => setSections((s) => ({ ...s, [item.key]: sec }))}
                    onToggle={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </motion.div>

        {/* Community Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Community Navigation</h3>
              <p className="text-sm text-muted-foreground">
                Drag to reorder, toggle to show/hide
              </p>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={communityItems.map((item) => item.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {communityItems.map((item) => (
                  <SortableNavItem
                    key={item.key}
                    item={item}
                    isEnabled={settings[item.key] ?? true}
                    section={(sections[item.key] || item.section) as NavSection}
                    onSectionChange={(sec) => setSections((s) => ({ ...s, [item.key]: sec }))}
                    onToggle={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This is how the navigation will appear to users (in order):
          </p>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Main</p>
              <div className="flex flex-wrap gap-2">
                {mainItems
                  .filter((item) => settings[item.key])
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <Badge key={item.key} variant="outline" className="gap-2 py-1.5 px-3">
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Badge>
                    );
                  })}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Community</p>
              <div className="flex flex-wrap gap-2">
                {communityItems
                  .filter((item) => settings[item.key])
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <Badge key={item.key} variant="outline" className="gap-2 py-1.5 px-3">
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Badge>
                    );
                  })}
              </div>
            </div>
          </div>
          {enabledCount === 0 && (
            <p className="text-muted-foreground text-sm mt-4">No navigation items visible</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
