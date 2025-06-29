import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GroupedTags, TagService } from '../tag.service';
import { ColorPaletteService } from '../color-palette.service';
import { Tag } from 'src/app/models';

@Injectable({ providedIn: 'root' })
export class TagColorService {
  private tagsSubject = new BehaviorSubject<GroupedTags>({});
  tags$ = this.tagsSubject.asObservable();

  private colorPalette: string[] = [];
  private groupColorMap = new Map<string, string>();
  private tagColorMap = new Map<number, string>();

  constructor(
    private tagService: TagService,
    private colorPaletteService: ColorPaletteService
  ) {}

  load(): void {
    // Load palette and tags in parallel
    this.colorPaletteService.fetchColorPaletteById(7).subscribe((palette) => {
      if (palette?.colors?.length) {
        this.colorPalette = palette.colors;
        this.loadTagsAndAssignColors();
      }
    });
  }

  private loadTagsAndAssignColors(): void {
    this.tagService.loadTags();
    this.tagService.tags$.subscribe((groupedTags) => {
      this.discretizeColors(groupedTags);
      this.tagsSubject.next(groupedTags);
    });
  }

  /**
   * Improved color discretization with better visual grouping
   */
  private discretizeColors(groupedTags: GroupedTags): void {
    const groups = Object.keys(groupedTags);
    const palette = this.colorPalette;
    const groupCount = groups.length;

    this.groupColorMap.clear();
    this.tagColorMap.clear();

    if (groupCount === 0 || palette.length === 0) return;

    // Add small buffers between groups (5% of palette)
    const bufferSize = Math.max(
      1,
      Math.floor((palette.length * 0.05) / groupCount)
    );
    const effectiveLength = palette.length - bufferSize * (groupCount - 1);
    const colorsPerGroup = Math.floor(effectiveLength / groupCount);

    console.log(
      `Distributing ${palette.length} colors across ${groupCount} groups:`
    );
    console.log(
      `Colors per group: ${colorsPerGroup}, Buffer size: ${bufferSize}`
    );

    groups.forEach((group, groupIdx) => {
      const tags = groupedTags[group];

      // Calculate group's color range with buffer
      const groupStart = groupIdx * (colorsPerGroup + bufferSize);
      const groupEnd = Math.min(
        groupStart + colorsPerGroup - 1,
        palette.length - 1
      );
      const groupSize = groupEnd - groupStart + 1;

      // Group color: use 1/3 position instead of middle to leave more space for tags
      const groupColorPos = groupStart + Math.floor(groupSize * 0.33);
      const groupColor = palette[groupColorPos];
      this.groupColorMap.set(group, groupColor);

      console.log(
        `Group "${group}": range [${groupStart}-${groupEnd}], group color at ${groupColorPos}`
      );

      if (tags.length === 0) return;

      // Distribute tags in the remaining space, avoiding group color area
      if (tags.length === 1) {
        // Single tag: use group color
        this.tagColorMap.set(tags[0].id, groupColor);
      } else {
        // Multiple tags: distribute around group color with spacing
        this.distributeTagColors(tags, groupStart, groupEnd, groupColorPos);
      }
    });
  }

  /**
   * Distribute tag colors within a group's range, avoiding the group color
   */
  private distributeTagColors(
    tags: Tag[],
    rangeStart: number,
    rangeEnd: number,
    groupColorPos: number
  ): void {
    const rangeSize = rangeEnd - rangeStart + 1;
    const minGap = 1; // Minimum gap from group color

    // Create two zones: before and after group color
    const beforeZone = {
      start: rangeStart,
      end: Math.max(rangeStart, groupColorPos - minGap - 1),
    };

    const afterZone = {
      start: Math.min(rangeEnd, groupColorPos + minGap + 1),
      end: rangeEnd,
    };

    // Get available positions
    const availablePositions: number[] = [];

    // Add positions from before zone
    for (let i = beforeZone.start; i <= beforeZone.end; i++) {
      availablePositions.push(i);
    }

    // Add positions from after zone
    for (let i = afterZone.start; i <= afterZone.end; i++) {
      availablePositions.push(i);
    }

    // If we don't have enough positions, fill in some closer to group color
    if (availablePositions.length < tags.length) {
      // Add positions closer to group color if needed
      for (
        let gap = 1;
        gap < minGap && availablePositions.length < tags.length;
        gap++
      ) {
        const closerBefore = groupColorPos - gap;
        const closerAfter = groupColorPos + gap;

        if (
          closerBefore >= rangeStart &&
          !availablePositions.includes(closerBefore)
        ) {
          availablePositions.push(closerBefore);
        }
        if (
          closerAfter <= rangeEnd &&
          !availablePositions.includes(closerAfter)
        ) {
          availablePositions.push(closerAfter);
        }
      }
    }

    // Sort positions for better distribution
    availablePositions.sort((a, b) => a - b);

    console.log(
      `  Distributing ${tags.length} tags in positions:`,
      availablePositions
    );

    // Assign colors to tags
    tags.forEach((tag, tagIdx) => {
      let colorIndex: number;

      if (availablePositions.length === 0) {
        // Fallback: use range edges
        colorIndex = tagIdx % 2 === 0 ? rangeStart : rangeEnd;
      } else if (tags.length <= availablePositions.length) {
        // Spread evenly across available positions
        const positionIdx = Math.floor(
          (tagIdx * availablePositions.length) / tags.length
        );
        colorIndex = availablePositions[positionIdx];
      } else {
        // More tags than positions: cycle through positions
        colorIndex = availablePositions[tagIdx % availablePositions.length];
      }

      // Ensure we don't go out of bounds
      colorIndex = Math.max(
        0,
        Math.min(colorIndex, this.colorPalette.length - 1)
      );

      this.tagColorMap.set(tag.id, this.colorPalette[colorIndex]);
      console.log(`    Tag "${tag.name}" -> color index ${colorIndex}`);
    });
  }

  getTagColor(tag: Tag): string {
    return this.tagColorMap.get(tag.id) || '#999999';
  }

  getGroupColor(group: string): string {
    return this.groupColorMap.get(group) || '#666666';
  }

  getGroups(): string[] {
    return Array.from(this.groupColorMap.keys());
  }

  getTagsByGroup(group: string): Tag[] {
    return this.tagsSubject.value[group] || [];
  }

  /**
   * Get debug info about color assignments
   */
  getColorDebugInfo(): {
    paletteSize: number;
    groupCount: number;
    assignments: Array<{
      group: string;
      groupColor: string;
      groupIndex: number;
      tags: Array<{
        name: string;
        color: string;
        index: number;
      }>;
    }>;
  } {
    const groups = this.getGroups();
    const assignments = groups.map((group) => {
      const groupColor = this.getGroupColor(group);
      const groupIndex = this.colorPalette.indexOf(groupColor);
      const tags = this.getTagsByGroup(group).map((tag) => ({
        name: tag.name,
        color: this.getTagColor(tag),
        index: this.colorPalette.indexOf(this.getTagColor(tag)),
      }));

      return {
        group,
        groupColor,
        groupIndex,
        tags,
      };
    });

    return {
      paletteSize: this.colorPalette.length,
      groupCount: groups.length,
      assignments,
    };
  }
}
