import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface SlotData {
  name: string;
  provider: string;
}

interface SlotPickerProps {
  value: { slot_name: string; provider: string };
  onChange: (data: { slot_name: string; provider: string }) => void;
  placeholder?: string;
  showProviderField?: boolean;
}

// Comprehensive slot database with providers - includes popular Stake.com slots
const SLOT_DATABASE: SlotData[] = [
  // Pragmatic Play
  { name: "Gates of Olympus", provider: "Pragmatic Play" },
  { name: "Gates of Olympus 1000", provider: "Pragmatic Play" },
  { name: "Sweet Bonanza", provider: "Pragmatic Play" },
  { name: "Sweet Bonanza 1000", provider: "Pragmatic Play" },
  { name: "Sugar Rush", provider: "Pragmatic Play" },
  { name: "Sugar Rush 1000", provider: "Pragmatic Play" },
  { name: "Starlight Princess", provider: "Pragmatic Play" },
  { name: "Starlight Princess 1000", provider: "Pragmatic Play" },
  { name: "The Dog House", provider: "Pragmatic Play" },
  { name: "The Dog House Megaways", provider: "Pragmatic Play" },
  { name: "The Dog House Multihold", provider: "Pragmatic Play" },
  { name: "Big Bass Bonanza", provider: "Pragmatic Play" },
  { name: "Big Bass Splash", provider: "Pragmatic Play" },
  { name: "Big Bass Amazon Xtreme", provider: "Pragmatic Play" },
  { name: "Big Bass Hold & Spinner", provider: "Pragmatic Play" },
  { name: "Fruit Party", provider: "Pragmatic Play" },
  { name: "Fruit Party 2", provider: "Pragmatic Play" },
  { name: "Madame Destiny Megaways", provider: "Pragmatic Play" },
  { name: "Wild West Gold", provider: "Pragmatic Play" },
  { name: "Wild West Gold Megaways", provider: "Pragmatic Play" },
  { name: "5 Lions Megaways", provider: "Pragmatic Play" },
  { name: "Buffalo King Megaways", provider: "Pragmatic Play" },
  { name: "Buffalo King Untamed Megaways", provider: "Pragmatic Play" },
  { name: "Zeus vs Hades", provider: "Pragmatic Play" },
  { name: "Zeus vs Hades Gods of War", provider: "Pragmatic Play" },
  { name: "Cleocatra", provider: "Pragmatic Play" },
  { name: "Gems Bonanza", provider: "Pragmatic Play" },
  { name: "Gates of Gatot Kaca", provider: "Pragmatic Play" },
  { name: "Gates of Gatot Kaca 1000", provider: "Pragmatic Play" },
  { name: "Wisdom of Athena", provider: "Pragmatic Play" },
  { name: "Wisdom of Athena 1000", provider: "Pragmatic Play" },
  { name: "Floating Dragon", provider: "Pragmatic Play" },
  { name: "Floating Dragon Hold & Spin", provider: "Pragmatic Play" },
  { name: "Floating Dragon Megaways", provider: "Pragmatic Play" },
  { name: "Power of Thor Megaways", provider: "Pragmatic Play" },
  { name: "The Hand of Midas", provider: "Pragmatic Play" },
  { name: "Release the Kraken", provider: "Pragmatic Play" },
  { name: "Release the Kraken 2", provider: "Pragmatic Play" },
  { name: "Gorilla Mayhem", provider: "Pragmatic Play" },
  { name: "Barn Festival", provider: "Pragmatic Play" },
  { name: "Spin & Score Megaways", provider: "Pragmatic Play" },
  { name: "Aztec Blaze", provider: "Pragmatic Play" },
  { name: "Extra Juicy Megaways", provider: "Pragmatic Play" },
  { name: "Pirate Golden Age", provider: "Pragmatic Play" },
  { name: "Pirate Gold Deluxe", provider: "Pragmatic Play" },
  { name: "Greedy Wolf", provider: "Pragmatic Play" },
  { name: "Fortune of Giza", provider: "Pragmatic Play" },
  { name: "Wild Beach Party", provider: "Pragmatic Play" },
  { name: "Wild Wild Riches", provider: "Pragmatic Play" },
  { name: "Hot Pepper", provider: "Pragmatic Play" },
  { name: "777 Deluxe", provider: "Pragmatic Play" },
  { name: "John Hunter Tomb of Scarab Queen", provider: "Pragmatic Play" },
  { name: "John Hunter Book of Tut", provider: "Pragmatic Play" },
  { name: "Juicy Fruits", provider: "Pragmatic Play" },
  { name: "Rabbit Garden", provider: "Pragmatic Play" },
  { name: "Wild Hop & Drop", provider: "Pragmatic Play" },
  { name: "Fire Strike 2", provider: "Pragmatic Play" },
  { name: "Candy Village", provider: "Pragmatic Play" },
  { name: "Mysterious Egypt", provider: "Pragmatic Play" },
  { name: "Congo Cash", provider: "Pragmatic Play" },
  { name: "Vegas Magic", provider: "Pragmatic Play" },
  { name: "Drago Jewels of Fortune", provider: "Pragmatic Play" },
  { name: "Might of Ra", provider: "Pragmatic Play" },
  { name: "Pyramid Bonanza", provider: "Pragmatic Play" },
  
  // Hacksaw Gaming
  { name: "Wanted Dead or a Wild", provider: "Hacksaw Gaming" },
  { name: "Chaos Crew", provider: "Hacksaw Gaming" },
  { name: "Chaos Crew 2", provider: "Hacksaw Gaming" },
  { name: "Stack 'Em", provider: "Hacksaw Gaming" },
  { name: "RIP City", provider: "Hacksaw Gaming" },
  { name: "Xpander", provider: "Hacksaw Gaming" },
  { name: "Fruity Treats", provider: "Hacksaw Gaming" },
  { name: "Hand of Anubis", provider: "Hacksaw Gaming" },
  { name: "IteroClassic", provider: "Hacksaw Gaming" },
  { name: "Toshi Video Club", provider: "Hacksaw Gaming" },
  { name: "Le Bandit", provider: "Hacksaw Gaming" },
  { name: "Gladiator Legends", provider: "Hacksaw Gaming" },
  { name: "Cube Loco", provider: "Hacksaw Gaming" },
  { name: "Cash Crew", provider: "Hacksaw Gaming" },
  { name: "Dork Unit", provider: "Hacksaw Gaming" },
  { name: "Rex the Hunt", provider: "Hacksaw Gaming" },
  { name: "Lotus In Flames", provider: "Hacksaw Gaming" },
  { name: "Ragefire", provider: "Hacksaw Gaming" },
  { name: "Lollipop", provider: "Hacksaw Gaming" },
  { name: "Om Nom", provider: "Hacksaw Gaming" },
  { name: "Om Nom Run", provider: "Hacksaw Gaming" },
  { name: "Bugsy's Bar", provider: "Hacksaw Gaming" },
  { name: "1000x Busta", provider: "Hacksaw Gaming" },
  { name: "All Ways Hot Fruits", provider: "Hacksaw Gaming" },
  { name: "Hop n Pop", provider: "Hacksaw Gaming" },
  { name: "Ice Ice Yeti", provider: "Hacksaw Gaming" },
  { name: "Rocket Reels", provider: "Hacksaw Gaming" },
  { name: "2024 Hit Slot", provider: "Hacksaw Gaming" },
  { name: "Blox", provider: "Hacksaw Gaming" },
  { name: "Blox 2", provider: "Hacksaw Gaming" },
  { name: "Rick and Morty Megaways", provider: "Hacksaw Gaming" },
  { name: "Master of Valhalla", provider: "Hacksaw Gaming" },
  { name: "Phantom's Mirror", provider: "Hacksaw Gaming" },
  
  // Nolimit City
  { name: "Mental", provider: "Nolimit City" },
  { name: "San Quentin", provider: "Nolimit City" },
  { name: "San Quentin xWays", provider: "Nolimit City" },
  { name: "Tombstone RIP", provider: "Nolimit City" },
  { name: "Tombstone", provider: "Nolimit City" },
  { name: "Tombstone No Mercy", provider: "Nolimit City" },
  { name: "Punk Rocker", provider: "Nolimit City" },
  { name: "Fire in the Hole", provider: "Nolimit City" },
  { name: "Fire in the Hole 2", provider: "Nolimit City" },
  { name: "Fire in the Hole xBomb", provider: "Nolimit City" },
  { name: "Misery Mining", provider: "Nolimit City" },
  { name: "El Paso Gunfight xNudge", provider: "Nolimit City" },
  { name: "Book of Shadows", provider: "Nolimit City" },
  { name: "Deadwood", provider: "Nolimit City" },
  { name: "Karen Maneater", provider: "Nolimit City" },
  { name: "Remember Gulag", provider: "Nolimit City" },
  { name: "xWays Hoarder xSplit", provider: "Nolimit City" },
  { name: "Gaelic Gold", provider: "Nolimit City" },
  { name: "Serial", provider: "Nolimit City" },
  { name: "Folsom Prison", provider: "Nolimit City" },
  { name: "Road Rage", provider: "Nolimit City" },
  { name: "Warrior Graveyard", provider: "Nolimit City" },
  { name: "Punk Toilet", provider: "Nolimit City" },
  { name: "Outsourced: Payday", provider: "Nolimit City" },
  { name: "Walk of Shame", provider: "Nolimit City" },
  { name: "Booze Bombs", provider: "Nolimit City" },
  { name: "Bounty Hunters", provider: "Nolimit City" },
  { name: "Starstruck", provider: "Nolimit City" },
  { name: "Das xBoot", provider: "Nolimit City" },
  { name: "East Coast vs West Coast", provider: "Nolimit City" },
  { name: "Infectious 5 xWays", provider: "Nolimit City" },
  { name: "True Grit Redemption", provider: "Nolimit City" },
  { name: "Barbarian Fury", provider: "Nolimit City" },
  { name: "Milky Ways", provider: "Nolimit City" },
  { name: "Miner Donkey Trouble", provider: "Nolimit City" },
  { name: "Bonus Bunnies", provider: "Nolimit City" },
  { name: "The Rave", provider: "Nolimit City" },
  
  // Play'n GO
  { name: "Book of Dead", provider: "Play'n GO" },
  { name: "Reactoonz", provider: "Play'n GO" },
  { name: "Reactoonz 2", provider: "Play'n GO" },
  { name: "Fire Joker", provider: "Play'n GO" },
  { name: "Legacy of Dead", provider: "Play'n GO" },
  { name: "Rise of Olympus", provider: "Play'n GO" },
  { name: "Rise of Olympus 100", provider: "Play'n GO" },
  { name: "Moon Princess", provider: "Play'n GO" },
  { name: "Moon Princess 100", provider: "Play'n GO" },
  { name: "Hugo 2", provider: "Play'n GO" },
  { name: "Wizard of Gems", provider: "Play'n GO" },
  { name: "Rich Wilde and the Tome of Madness", provider: "Play'n GO" },
  { name: "Rich Wilde and the Shield of Athena", provider: "Play'n GO" },
  { name: "Cat Wilde and the Doom of Dead", provider: "Play'n GO" },
  { name: "Cat Wilde and the Eclipse of the Sun God", provider: "Play'n GO" },
  { name: "Annihilator", provider: "Play'n GO" },
  { name: "Sweet Alchemy", provider: "Play'n GO" },
  { name: "Multifruit 81", provider: "Play'n GO" },
  { name: "Honey Rush", provider: "Play'n GO" },
  { name: "Ring of Odin", provider: "Play'n GO" },
  { name: "Coils of Cash", provider: "Play'n GO" },
  { name: "Mystery Joker", provider: "Play'n GO" },
  { name: "Wild Frames", provider: "Play'n GO" },
  { name: "Contact", provider: "Play'n GO" },
  { name: "Raging Rex", provider: "Play'n GO" },
  { name: "Raging Rex 2", provider: "Play'n GO" },
  { name: "Pimped", provider: "Play'n GO" },
  { name: "The Green Knight", provider: "Play'n GO" },
  
  // NetEnt
  { name: "Gonzo's Quest", provider: "NetEnt" },
  { name: "Gonzo's Quest Megaways", provider: "NetEnt" },
  { name: "Dead or Alive 2", provider: "NetEnt" },
  { name: "Dead or Alive", provider: "NetEnt" },
  { name: "Starburst", provider: "NetEnt" },
  { name: "Starburst XXXtreme", provider: "NetEnt" },
  { name: "Narcos", provider: "NetEnt" },
  { name: "Divine Fortune", provider: "NetEnt" },
  { name: "Divine Fortune Megaways", provider: "NetEnt" },
  { name: "Jack and the Beanstalk", provider: "NetEnt" },
  { name: "Twin Spin", provider: "NetEnt" },
  { name: "Twin Spin Megaways", provider: "NetEnt" },
  { name: "Blood Suckers", provider: "NetEnt" },
  { name: "Blood Suckers 2", provider: "NetEnt" },
  { name: "Asgardian Stones", provider: "NetEnt" },
  { name: "Butterfly Staxx", provider: "NetEnt" },
  { name: "Butterfly Staxx 2", provider: "NetEnt" },
  { name: "The Wish Master", provider: "NetEnt" },
  { name: "Steam Tower", provider: "NetEnt" },
  { name: "Secret of the Stones", provider: "NetEnt" },
  { name: "Finn and the Swirly Spin", provider: "NetEnt" },
  { name: "Finn's Golden Tavern", provider: "NetEnt" },
  { name: "Jumanji", provider: "NetEnt" },
  { name: "Vikings", provider: "NetEnt" },
  
  // Big Time Gaming
  { name: "Bonanza", provider: "Big Time Gaming" },
  { name: "Bonanza Gold", provider: "Big Time Gaming" },
  { name: "Extra Chilli", provider: "Big Time Gaming" },
  { name: "Extra Chilli Epic Spins", provider: "Big Time Gaming" },
  { name: "White Rabbit", provider: "Big Time Gaming" },
  { name: "White Rabbit Megaways", provider: "Big Time Gaming" },
  { name: "Danger High Voltage", provider: "Big Time Gaming" },
  { name: "Danger High Voltage 2", provider: "Big Time Gaming" },
  { name: "Rasputin Megaways", provider: "Big Time Gaming" },
  { name: "Lil Devil", provider: "Big Time Gaming" },
  { name: "Who Wants to Be a Millionaire", provider: "Big Time Gaming" },
  { name: "Kingmaker", provider: "Big Time Gaming" },
  { name: "Book of Gods", provider: "Big Time Gaming" },
  { name: "Cyberslot Megaclusters", provider: "Big Time Gaming" },
  { name: "Chocolates", provider: "Big Time Gaming" },
  { name: "Opal Fruits", provider: "Big Time Gaming" },
  { name: "Monopoly Megaways", provider: "Big Time Gaming" },
  { name: "Temple of Treasures Megaways", provider: "Big Time Gaming" },
  { name: "Donuts", provider: "Big Time Gaming" },
  { name: "The Final Countdown", provider: "Big Time Gaming" },
  { name: "Queen of Riches", provider: "Big Time Gaming" },
  { name: "Royal Mint Megaways", provider: "Big Time Gaming" },
  
  // Push Gaming
  { name: "Jammin' Jars", provider: "Push Gaming" },
  { name: "Jammin' Jars 2", provider: "Push Gaming" },
  { name: "Razor Shark", provider: "Push Gaming" },
  { name: "Razor Returns", provider: "Push Gaming" },
  { name: "Fat Rabbit", provider: "Push Gaming" },
  { name: "Wild Swarm", provider: "Push Gaming" },
  { name: "Wild Swarm 2", provider: "Push Gaming" },
  { name: "Mystery Mission: To The Moon", provider: "Push Gaming" },
  { name: "Space Stacks", provider: "Push Gaming" },
  { name: "Bison Battle", provider: "Push Gaming" },
  { name: "Fire Hopper", provider: "Push Gaming" },
  { name: "Booty Bay", provider: "Push Gaming" },
  { name: "Joker's Jewels", provider: "Push Gaming" },
  { name: "Retro Tapes", provider: "Push Gaming" },
  { name: "Mad Cars", provider: "Push Gaming" },
  { name: "The Shadow Order", provider: "Push Gaming" },
  { name: "Dinopolis", provider: "Push Gaming" },
  { name: "Fat Drac", provider: "Push Gaming" },
  { name: "Land of the Free", provider: "Push Gaming" },
  { name: "Fat Banker", provider: "Push Gaming" },
  { name: "Deadly 5", provider: "Push Gaming" },
  
  // Relax Gaming
  { name: "Money Train", provider: "Relax Gaming" },
  { name: "Money Train 2", provider: "Relax Gaming" },
  { name: "Money Train 3", provider: "Relax Gaming" },
  { name: "Money Train 4", provider: "Relax Gaming" },
  { name: "Money Train Origins", provider: "Relax Gaming" },
  { name: "Temple Tumble", provider: "Relax Gaming" },
  { name: "Temple Tumble 2", provider: "Relax Gaming" },
  { name: "Dream Drop Diamonds", provider: "Relax Gaming" },
  { name: "Snake Arena", provider: "Relax Gaming" },
  { name: "Book of 99", provider: "Relax Gaming" },
  { name: "Iron Bank", provider: "Relax Gaming" },
  { name: "Dead Man's Trail", provider: "Relax Gaming" },
  { name: "Hellcatraz", provider: "Relax Gaming" },
  { name: "Beast Mode", provider: "Relax Gaming" },
  { name: "Top Dawg$", provider: "Relax Gaming" },
  { name: "Volatile Vikings", provider: "Relax Gaming" },
  { name: "Banana Town", provider: "Relax Gaming" },
  { name: "TNT Tumble", provider: "Relax Gaming" },
  { name: "Volatile Vikings 2 Dream Drop", provider: "Relax Gaming" },
  { name: "Mega Death", provider: "Relax Gaming" },
  { name: "Plunderland", provider: "Relax Gaming" },
  
  // Red Tiger
  { name: "Dragon's Fire Megaways", provider: "Red Tiger" },
  { name: "Dragon's Fire", provider: "Red Tiger" },
  { name: "Piggy Riches Megaways", provider: "Red Tiger" },
  { name: "Reel King Megaways", provider: "Red Tiger" },
  { name: "Mystery Reels Megaways", provider: "Red Tiger" },
  { name: "Mega Rise", provider: "Red Tiger" },
  { name: "Arcade Bomb", provider: "Red Tiger" },
  { name: "Fortune House", provider: "Red Tiger" },
  { name: "Primate King", provider: "Red Tiger" },
  { name: "Cash Volt", provider: "Red Tiger" },
  { name: "Vicky Ventura", provider: "Red Tiger" },
  { name: "Dragon's Luck", provider: "Red Tiger" },
  { name: "Dragon's Luck Megaways", provider: "Red Tiger" },
  { name: "Dragon's Luck Power Reels", provider: "Red Tiger" },
  { name: "The Wild Hatter", provider: "Red Tiger" },
  { name: "10001 Nights Megaways", provider: "Red Tiger" },
  { name: "Rio Stars", provider: "Red Tiger" },
  
  // ELK Studios
  { name: "Kaiju", provider: "ELK Studios" },
  { name: "Wild Toro", provider: "ELK Studios" },
  { name: "Wild Toro 2", provider: "ELK Studios" },
  { name: "Cygnus", provider: "ELK Studios" },
  { name: "Cygnus 2", provider: "ELK Studios" },
  { name: "Pirots", provider: "ELK Studios" },
  { name: "Pirots 2", provider: "ELK Studios" },
  { name: "Pirots 3", provider: "ELK Studios" },
  { name: "Ecuador Gold", provider: "ELK Studios" },
  { name: "Valkyrie", provider: "ELK Studios" },
  { name: "Poltava Flames of War", provider: "ELK Studios" },
  { name: "Bompers", provider: "ELK Studios" },
  { name: "Tropicool", provider: "ELK Studios" },
  { name: "Tropicool 2", provider: "ELK Studios" },
  { name: "Tropicool 3", provider: "ELK Studios" },
  { name: "Toro 7s", provider: "ELK Studios" },
  { name: "Nitropolis", provider: "ELK Studios" },
  { name: "Nitropolis 2", provider: "ELK Studios" },
  { name: "Nitropolis 3", provider: "ELK Studios" },
  { name: "Nitropolis 4", provider: "ELK Studios" },
  { name: "Katmandu X", provider: "ELK Studios" },
  { name: "O'Reilly's Gold", provider: "ELK Studios" },
  { name: "Lake's Five", provider: "ELK Studios" },
  { name: "Hit It Hard", provider: "ELK Studios" },
  { name: "Mystic Wheel", provider: "ELK Studios" },
  
  // Thunderkick
  { name: "Beat the Beast", provider: "Thunderkick" },
  { name: "Pink Elephants", provider: "Thunderkick" },
  { name: "Pink Elephants 2", provider: "Thunderkick" },
  { name: "Esqueleto Explosivo", provider: "Thunderkick" },
  { name: "Esqueleto Explosivo 2", provider: "Thunderkick" },
  { name: "Fruit Warp", provider: "Thunderkick" },
  { name: "Birds on a Wire", provider: "Thunderkick" },
  { name: "Carnival Queen", provider: "Thunderkick" },
  { name: "Babushkas", provider: "Thunderkick" },
  { name: "Zoom", provider: "Thunderkick" },
  { name: "Full Moon Romance", provider: "Thunderkick" },
  { name: "Flame Busters", provider: "Thunderkick" },
  { name: "Dragon Horn", provider: "Thunderkick" },
  { name: "Yeti: Battle of Greenhat Peak", provider: "Thunderkick" },
  { name: "Midas Golden Touch", provider: "Thunderkick" },
  { name: "Sword of Khans", provider: "Thunderkick" },
  { name: "The Falcon Huntress", provider: "Thunderkick" },
  { name: "Not Enough Kittens", provider: "Thunderkick" },
  { name: "Roasty McFry", provider: "Thunderkick" },
  
  // Yggdrasil
  { name: "Valley of the Gods", provider: "Yggdrasil" },
  { name: "Valley of the Gods 2", provider: "Yggdrasil" },
  { name: "Vikings Go Berzerk", provider: "Yggdrasil" },
  { name: "Vikings Go Berzerk Reloaded", provider: "Yggdrasil" },
  { name: "Vikings Go Wild", provider: "Yggdrasil" },
  { name: "Vikings Go to Hell", provider: "Yggdrasil" },
  { name: "Hades: Gigablox", provider: "Yggdrasil" },
  { name: "Loki Wild Tiles", provider: "Yggdrasil" },
  { name: "Penguin City", provider: "Yggdrasil" },
  { name: "Golden Fish Tank", provider: "Yggdrasil" },
  { name: "Golden Fish Tank 2 Gigablox", provider: "Yggdrasil" },
  { name: "Holmes and the Stolen Stones", provider: "Yggdrasil" },
  { name: "Jackpot Raiders", provider: "Yggdrasil" },
  { name: "Tut's Twister", provider: "Yggdrasil" },
  { name: "9K Yeti", provider: "Yggdrasil" },
  { name: "Big Blox", provider: "Yggdrasil" },
  { name: "Nitro Circus", provider: "Yggdrasil" },
  { name: "Trolls Bridge", provider: "Yggdrasil" },
  { name: "Trolls Bridge 2", provider: "Yggdrasil" },
  
  // Blueprint Gaming
  { name: "Eye of Horus", provider: "Blueprint Gaming" },
  { name: "Eye of Horus Megaways", provider: "Blueprint Gaming" },
  { name: "Legacy of Ra Megaways", provider: "Blueprint Gaming" },
  { name: "Genie Jackpots Megaways", provider: "Blueprint Gaming" },
  { name: "Deal or No Deal Megaways", provider: "Blueprint Gaming" },
  { name: "Fishin' Frenzy Megaways", provider: "Blueprint Gaming" },
  { name: "Fishin' Frenzy", provider: "Blueprint Gaming" },
  { name: "Fishin' Frenzy: Big Catch", provider: "Blueprint Gaming" },
  { name: "Gods of Olympus Megaways", provider: "Blueprint Gaming" },
  { name: "King Kong Cash", provider: "Blueprint Gaming" },
  { name: "King Kong Cash Megaways", provider: "Blueprint Gaming" },
  { name: "Ted Megaways", provider: "Blueprint Gaming" },
  { name: "The Goonies", provider: "Blueprint Gaming" },
  { name: "The Goonies Megaways", provider: "Blueprint Gaming" },
  { name: "Worms Reloaded", provider: "Blueprint Gaming" },
  
  // Microgaming
  { name: "Immortal Romance", provider: "Microgaming" },
  { name: "Immortal Romance Mega Moolah", provider: "Microgaming" },
  { name: "Mega Moolah", provider: "Microgaming" },
  { name: "Mega Moolah Goddess", provider: "Microgaming" },
  { name: "Thunderstruck 2", provider: "Microgaming" },
  { name: "Thunderstruck Wild Lightning", provider: "Microgaming" },
  { name: "9 Masks of Fire", provider: "Microgaming" },
  { name: "9 Masks of Fire Hyperspins", provider: "Microgaming" },
  { name: "Break Da Bank Again Megaways", provider: "Microgaming" },
  { name: "Playboy Gold", provider: "Microgaming" },
  { name: "Cashville", provider: "Microgaming" },
  { name: "Game of Thrones 243 Ways", provider: "Microgaming" },
  { name: "Lucky Leprechaun", provider: "Microgaming" },
  { name: "Avalon", provider: "Microgaming" },
  { name: "Avalon II", provider: "Microgaming" },
  { name: "Jurassic Park", provider: "Microgaming" },
  { name: "Jurassic World", provider: "Microgaming" },
  
  // Evolution / Live Casino
  { name: "Crazy Time", provider: "Evolution" },
  { name: "Lightning Roulette", provider: "Evolution" },
  { name: "Monopoly Live", provider: "Evolution" },
  { name: "Dream Catcher", provider: "Evolution" },
  { name: "Lightning Blackjack", provider: "Evolution" },
  { name: "Mega Ball", provider: "Evolution" },
  { name: "Cash or Crash", provider: "Evolution" },
  { name: "Funky Time", provider: "Evolution" },
  { name: "XXXtreme Lightning Roulette", provider: "Evolution" },
  { name: "Lightning Baccarat", provider: "Evolution" },
  
  // Stake Originals
  { name: "Crash", provider: "Stake Originals" },
  { name: "Plinko", provider: "Stake Originals" },
  { name: "Dice", provider: "Stake Originals" },
  { name: "Limbo", provider: "Stake Originals" },
  { name: "Mines", provider: "Stake Originals" },
  { name: "Keno", provider: "Stake Originals" },
  { name: "Dragon Tower", provider: "Stake Originals" },
  { name: "Scarab Spin", provider: "Stake Originals" },
  { name: "Hilo", provider: "Stake Originals" },
  { name: "Blackjack", provider: "Stake Originals" },
  { name: "Roulette", provider: "Stake Originals" },
  { name: "Video Poker", provider: "Stake Originals" },
  { name: "Baccarat", provider: "Stake Originals" },
  { name: "Wheel", provider: "Stake Originals" },
  { name: "Slide", provider: "Stake Originals" },
  { name: "Tome of Life", provider: "Stake Originals" },
  { name: "Blue Samurai", provider: "Stake Originals" },
  
  // BGaming
  { name: "Elvis Frog in Vegas", provider: "BGaming" },
  { name: "Elvis Frog TRUEWAYS", provider: "BGaming" },
  { name: "Fruit Million", provider: "BGaming" },
  { name: "Aloha King Elvis", provider: "BGaming" },
  { name: "Dig Dig Digger", provider: "BGaming" },
  { name: "Johnny Cash", provider: "BGaming" },
  { name: "Space XY", provider: "BGaming" },
  { name: "Aztec Magic Deluxe", provider: "BGaming" },
  { name: "Aztec Magic Megaways", provider: "BGaming" },
  { name: "Bonanza Billion", provider: "BGaming" },
  { name: "Book of Cats", provider: "BGaming" },
  { name: "Crash X", provider: "BGaming" },
  { name: "Plinko", provider: "BGaming" },
  { name: "Wild Cash", provider: "BGaming" },
  { name: "Wild Cash x9990", provider: "BGaming" },
  { name: "Lucky Lady Clover", provider: "BGaming" },
  { name: "Lucky Lady Moon Megaways", provider: "BGaming" },
  { name: "Miss Cherry Fruits", provider: "BGaming" },
  
  // Spinomenal
  { name: "Book of Demi Gods II", provider: "Spinomenal" },
  { name: "Book of Piggy Bank", provider: "Spinomenal" },
  { name: "Majestic King", provider: "Spinomenal" },
  { name: "Wolf Fang", provider: "Spinomenal" },
  { name: "Story of Hercules", provider: "Spinomenal" },
  { name: "Demi Gods II Expanded", provider: "Spinomenal" },
  { name: "Path of Destiny", provider: "Spinomenal" },
  
  // Spribe
  { name: "Aviator", provider: "Spribe" },
  { name: "Goal", provider: "Spribe" },
  { name: "Keno", provider: "Spribe" },
  { name: "Mines", provider: "Spribe" },
  { name: "Dice", provider: "Spribe" },
  { name: "Hilo", provider: "Spribe" },
  { name: "Plinko", provider: "Spribe" },
  { name: "Hotline", provider: "Spribe" },
  { name: "Mini Roulette", provider: "Spribe" },
  
  // Wazdan
  { name: "Burning Stars 3", provider: "Wazdan" },
  { name: "Sizzling Eggs", provider: "Wazdan" },
  { name: "9 Lions", provider: "Wazdan" },
  { name: "Power of Gods: Egypt", provider: "Wazdan" },
  { name: "Power of Gods: Hades", provider: "Wazdan" },
  { name: "Larry the Leprechaun", provider: "Wazdan" },
  { name: "Hot Slot: 777 Stars", provider: "Wazdan" },
  { name: "Magic Stars 3", provider: "Wazdan" },
  { name: "Magic Owls", provider: "Wazdan" },
  
  // Quickspin
  { name: "Big Bad Wolf", provider: "Quickspin" },
  { name: "Big Bad Wolf Megaways", provider: "Quickspin" },
  { name: "Sakura Fortune", provider: "Quickspin" },
  { name: "Sakura Fortune 2", provider: "Quickspin" },
  { name: "Sticky Bandits", provider: "Quickspin" },
  { name: "Sticky Bandits Wild Return", provider: "Quickspin" },
  { name: "Dwarfs Gone Wild", provider: "Quickspin" },
  { name: "Hammer of Vulcan", provider: "Quickspin" },
  { name: "Northern Sky", provider: "Quickspin" },
  { name: "Mighty Arthur", provider: "Quickspin" },
  { name: "Crystal Prince", provider: "Quickspin" },
  { name: "Phoenix Sun", provider: "Quickspin" },
  
  // Tom Horn Gaming
  { name: "Book of Spells", provider: "Tom Horn Gaming" },
  { name: "243 Crystal Fruits", provider: "Tom Horn Gaming" },
  { name: "88 Wild Dragon", provider: "Tom Horn Gaming" },
  { name: "Don Juan's Peppers", provider: "Tom Horn Gaming" },
  { name: "Wild Weather", provider: "Tom Horn Gaming" },
  
  // More Popular Stake Slots
  { name: "Fruit Party 3", provider: "Pragmatic Play" },
  { name: "Sweet Bonanza Dice", provider: "Pragmatic Play" },
  { name: "Hot Fiesta", provider: "Pragmatic Play" },
  { name: "Aztec Gems Deluxe", provider: "Pragmatic Play" },
  { name: "Queenie", provider: "Pragmatic Play" },
  { name: "Cash Bonanza", provider: "Pragmatic Play" },
  { name: "Wolf Gold", provider: "Pragmatic Play" },
  { name: "Chilli Heat", provider: "Pragmatic Play" },
  { name: "Chilli Heat Megaways", provider: "Pragmatic Play" },
  { name: "Christmas Carol Megaways", provider: "Pragmatic Play" },
  { name: "Christmas Big Bass Bonanza", provider: "Pragmatic Play" },
  { name: "Curse of the Werewolf Megaways", provider: "Pragmatic Play" },
  { name: "Peaky Blinders", provider: "Pragmatic Play" },
  { name: "Treasure Wild", provider: "Pragmatic Play" },
  { name: "Cowboy Coins", provider: "Pragmatic Play" },
  { name: "Lucky Lightning", provider: "Pragmatic Play" },
  { name: "Return of the Dead", provider: "Pragmatic Play" },
];

export function SlotPicker({ value, onChange, placeholder = "Search slots...", showProviderField = true }: SlotPickerProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value.slot_name || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input - search both name and provider
  const filteredSlots = SLOT_DATABASE.filter(slot => {
    const query = searchQuery.toLowerCase();
    return slot.name.toLowerCase().includes(query) || 
           slot.provider.toLowerCase().includes(query);
  }).slice(0, 10);

  const handleSelectSlot = (slot: SlotData) => {
    setSearchQuery(slot.name);
    onChange({ slot_name: slot.name, provider: slot.provider });
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange({ ...value, slot_name: newValue });
    setShowSuggestions(true);
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, provider: e.target.value });
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync search query with value prop
  useEffect(() => {
    if (value.slot_name !== searchQuery && !showSuggestions) {
      setSearchQuery(value.slot_name || "");
    }
  }, [value.slot_name]);

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="relative">
        <Label className="text-xs">Slot Name</Label>
        <div className="relative">
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="h-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                onChange({ slot_name: "", provider: "" });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && filteredSlots.length > 0 && searchQuery && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredSlots.map((slot, index) => (
              <button
                key={`${slot.name}-${slot.provider}-${index}`}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center justify-between"
                onClick={() => handleSelectSlot(slot)}
              >
                <span className="font-medium text-sm">{slot.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {slot.provider}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {showProviderField && (
        <div>
          <Label className="text-xs">Provider</Label>
          <Input
            value={value.provider}
            onChange={handleProviderChange}
            placeholder="Provider (auto-filled)"
            className="h-9"
          />
        </div>
      )}
    </div>
  );
}

export { SLOT_DATABASE };
