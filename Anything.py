#!/usr/bin/env python3
"""
Design Token Statistics Utility
Analyzes and displays statistics about your design tokens.
"""

import json
from pathlib import Path
from collections import defaultdict


def count_tokens(obj, path=""):
    """Recursively count tokens and categorize by type."""
    stats = defaultdict(int)
    tokens = []
    
    if isinstance(obj, dict):
        if "type" in obj and "value" in obj:
            # This is a token
            token_type = obj.get("type", "unknown")
            stats[token_type] += 1
            tokens.append({"path": path, "type": token_type, "value": obj["value"]})
        else:
            # This is a group, recurse
            for key, value in obj.items():
                child_path = f"{path}.{key}" if path else key
                child_stats, child_tokens = count_tokens(value, child_path)
                for k, v in child_stats.items():
                    stats[k] += v
                tokens.extend(child_tokens)
    
    return dict(stats), tokens


def analyze_tokens_file(filepath):
    """Analyze a single tokens file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return count_tokens(data)


def print_color_swatch(hex_color):
    """Print a color swatch using ANSI escape codes (approximation)."""
    if not hex_color.startswith('#'):
        return "   "
    try:
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 6:
            r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
            return f"\033[48;2;{r};{g};{b}m   \033[0m"
    except:
        pass
    return "   "


def main():
    tokens_dir = Path("tokens")
    
    if not tokens_dir.exists():
        print("Error: tokens/ directory not found!")
        return
    
    print("=" * 60)
    print("   MOJ Design Tokens - Statistics Report")
    print("=" * 60)
    print()
    
    total_stats = defaultdict(int)
    all_tokens = []
    
    # Analyze all JSON files in tokens directory
    for json_file in sorted(tokens_dir.rglob("*.json")):
        relative_path = json_file.relative_to(tokens_dir)
        stats, tokens = analyze_tokens_file(json_file)
        
        print(f"📁 {relative_path}")
        for token_type, count in sorted(stats.items()):
            print(f"   └─ {token_type}: {count}")
            total_stats[token_type] += count
        all_tokens.extend(tokens)
        print()
    
    # Summary
    print("=" * 60)
    print("   SUMMARY")
    print("=" * 60)
    print()
    
    total = sum(total_stats.values())
    print(f"Total Tokens: {total}")
    print()
    print("By Type:")
    for token_type, count in sorted(total_stats.items(), key=lambda x: -x[1]):
        percentage = (count / total) * 100 if total > 0 else 0
        bar = "█" * int(percentage / 5)
        print(f"  {token_type:15} {count:4}  ({percentage:5.1f}%) {bar}")
    
    # Color palette preview
    print()
    print("=" * 60)
    print("   COLOR PALETTE PREVIEW")
    print("=" * 60)
    print()
    
    color_tokens = [t for t in all_tokens if t["type"] == "color" and isinstance(t["value"], str) and t["value"].startswith("#")]
    
    # Group by first path segment
    color_groups = defaultdict(list)
    for token in color_tokens[:50]:  # Limit to first 50 for display
        group = token["path"].split(".")[0]
        color_groups[group].append(token)
    
    for group, colors in list(color_groups.items())[:5]:  # Show up to 5 groups
        print(f"  {group}:")
        for color in colors[:10]:  # Show up to 10 colors per group
            swatch = print_color_swatch(color["value"])
            short_path = ".".join(color["path"].split(".")[-2:])
            print(f"    {swatch} {color['value']:9} - {short_path}")
        if len(colors) > 10:
            print(f"    ... and {len(colors) - 10} more")
        print()
    
    print("=" * 60)
    print("   Report generated successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
