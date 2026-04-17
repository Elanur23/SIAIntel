/**
 * SIA Ad Placement Strategy
 * Google AdSense Policy Compliant Ad Positioning System
 * 
 * CRITICAL RULES:
 * - Ad density ≤30% of main content
 * - Minimum distance between ads: 250px
 * - No ads above the fold on mobile (first 600px)
 * - Responsive positioning based on screen size
 * - Content-first approach (ads don't push content)
 */

import type { AdPosition, AdSize } from './AdRefreshManager'

export interface PlacementCoordinates {
  position: AdPosition
  top: number
  left: number
  width: number
  height: number
  zIndex: number
  isFixed: boolean
  breakpoint: 'mobile' | 'tablet' | 'desktop'
}

export interface ContentLayout {
  totalHeight: number
  contentWidth: number
  sidebarWidth: number
  headerHeight: number
  footerHeight: number
  articleSections: number
  hassidebar: boolean
}

export interface AdDensityCalculation {
  mainContentArea: number // px²
  totalAdArea: number // px²
  densityPercentage: number // %
  isCompliant: boolean // ≤30%
  maxAllowedAdArea: number // px²
  remainingAdSpace: number // px²
}

/**
 * Calculate optimal ad positions based on content layout
 */
export function calculateOptimalPlacements(
  layout: ContentLayout,
  screenWidth: number,
  screenHeight: number
): PlacementCoordinates[] {
  const placements: PlacementCoordinates[] = []
  const breakpoint = getBreakpoint(screenWidth)
  const minAdDistance = 250 // Minimum 250px between ads

  // Header Ad (Desktop/Tablet only, not on mobile)
  if (breakpoint !== 'mobile' && layout.headerHeight >= 90) {
    placements.push({
      position: 'header',
      top: 0,
      left: 0,
      width: screenWidth,
      height: 90,
      zIndex: 100,
      isFixed: false,
      breakpoint
    })
  }

  // Sidebar Ads (Desktop only)
  if (breakpoint === 'desktop' && layout.hassidebar) {
    const sidebarLeft = layout.contentWidth + 20 // 20px gap

    // Sidebar Top (300x250)
    if (layout.totalHeight > 800) {
      placements.push({
        position: 'sidebar-top',
        top: layout.headerHeight + 100,
        left: sidebarLeft,
        width: 300,
        height: 250,
        zIndex: 10,
        isFixed: false,
        breakpoint
      })
    }

    // Sidebar Middle (300x600) - only if enough space
    if (layout.totalHeight > 1500) {
      placements.push({
        position: 'sidebar-middle',
        top: layout.headerHeight + 100 + 250 + minAdDistance,
        left: sidebarLeft,
        width: 300,
        height: 600,
        zIndex: 10,
        isFixed: false,
        breakpoint
      })
    }

    // Sidebar Bottom (300x250)
    if (layout.totalHeight > 2000) {
      placements.push({
        position: 'sidebar-bottom',
        top: layout.totalHeight - layout.footerHeight - 250 - 100,
        left: sidebarLeft,
        width: 300,
        height: 250,
        zIndex: 10,
        isFixed: false,
        breakpoint
      })
    }
  }

  // Article Ads (All breakpoints)
  const articleWidth = breakpoint === 'mobile' ? screenWidth - 40 : layout.contentWidth
  const articleLeft = breakpoint === 'mobile' ? 20 : 0

  // Article Top (after first paragraph, min 600px from top on mobile)
  const articleTopPosition = breakpoint === 'mobile' ? 
    Math.max(600, layout.headerHeight + 200) : 
    layout.headerHeight + 200

  if (layout.totalHeight > 1000) {
    placements.push({
      position: 'article-top',
      top: articleTopPosition,
      left: articleLeft,
      width: articleWidth,
      height: breakpoint === 'mobile' ? 100 : 250,
      zIndex: 5,
      isFixed: false,
      breakpoint
    })
  }

  // Article Middle (between sections)
  if (layout.articleSections >= 3 && layout.totalHeight > 1500) {
    const middlePosition = layout.headerHeight + (layout.totalHeight - layout.headerHeight - layout.footerHeight) / 2
    
    placements.push({
      position: 'article-middle',
      top: middlePosition,
      left: articleLeft,
      width: articleWidth,
      height: breakpoint === 'mobile' ? 100 : 250,
      zIndex: 5,
      isFixed: false,
      breakpoint
    })
  }

  // Article Bottom (before footer)
  if (layout.totalHeight > 1200) {
    placements.push({
      position: 'article-bottom',
      top: layout.totalHeight - layout.footerHeight - (breakpoint === 'mobile' ? 100 : 250) - 100,
      left: articleLeft,
      width: articleWidth,
      height: breakpoint === 'mobile' ? 100 : 250,
      zIndex: 5,
      isFixed: false,
      breakpoint
    })
  }

  // Native Feed Ad (in content flow)
  if (layout.articleSections >= 2) {
    const feedPosition = layout.headerHeight + (layout.totalHeight - layout.headerHeight) * 0.4
    
    placements.push({
      position: 'native-feed',
      top: feedPosition,
      left: articleLeft,
      width: articleWidth,
      height: breakpoint === 'mobile' ? 100 : 250,
      zIndex: 5,
      isFixed: false,
      breakpoint
    })
  }

  // Footer Ad (All breakpoints)
  placements.push({
    position: 'footer',
    top: layout.totalHeight - layout.footerHeight,
    left: 0,
    width: screenWidth,
    height: breakpoint === 'mobile' ? 50 : 90,
    zIndex: 100,
    isFixed: false,
    breakpoint
  })

  return placements
}

/**
 * Calculate ad density and compliance
 */
export function calculateAdDensity(
  placements: PlacementCoordinates[],
  contentLayout: ContentLayout
): AdDensityCalculation {
  // Calculate main content area (excluding header/footer)
  const mainContentHeight = contentLayout.totalHeight - contentLayout.headerHeight - contentLayout.footerHeight
  const mainContentArea = contentLayout.contentWidth * mainContentHeight

  // Calculate total ad area
  const totalAdArea = placements.reduce((sum, placement) => {
    // Only count ads within main content area
    if (placement.position !== 'header' && placement.position !== 'footer') {
      return sum + (placement.width * placement.height)
    }
    return sum
  }, 0)

  // Calculate density percentage
  const densityPercentage = (totalAdArea / mainContentArea) * 100

  // Maximum allowed ad area (30% of content)
  const maxAllowedAdArea = mainContentArea * 0.30

  return {
    mainContentArea,
    totalAdArea,
    densityPercentage,
    isCompliant: densityPercentage <= 30,
    maxAllowedAdArea,
    remainingAdSpace: maxAllowedAdArea - totalAdArea
  }
}

/**
 * Filter placements to ensure compliance
 */
export function filterCompliantPlacements(
  placements: PlacementCoordinates[],
  contentLayout: ContentLayout
): PlacementCoordinates[] {
  let filteredPlacements: PlacementCoordinates[] = []
  
  // Priority order (high-value positions first)
  const priorityOrder: AdPosition[] = [
    'article-top',
    'sidebar-top',
    'article-middle',
    'sidebar-middle',
    'native-feed',
    'article-bottom',
    'sidebar-bottom',
    'header',
    'footer'
  ]

  // Sort placements by priority
  const sortedPlacements = placements.sort((a, b) => {
    return priorityOrder.indexOf(a.position) - priorityOrder.indexOf(b.position)
  })

  // Add placements until we hit 30% density limit
  for (const placement of sortedPlacements) {
    const testPlacements = [...filteredPlacements, placement]
    const density = calculateAdDensity(testPlacements, contentLayout)

    if (density.isCompliant) {
      filteredPlacements.push(placement)
    } else {
      console.log(`[AdPlacement] Skipping ${placement.position} - would exceed 30% density limit`)
      break
    }
  }

  return filteredPlacements
}

/**
 * Get breakpoint based on screen width
 */
function getBreakpoint(screenWidth: number): 'mobile' | 'tablet' | 'desktop' {
  if (screenWidth < 768) return 'mobile'
  if (screenWidth < 1024) return 'tablet'
  return 'desktop'
}

/**
 * Get recommended ad size for position and breakpoint
 */
export function getRecommendedAdSize(
  position: AdPosition,
  breakpoint: 'mobile' | 'tablet' | 'desktop'
): AdSize {
  if (breakpoint === 'mobile') {
    switch (position) {
      case 'header':
      case 'footer':
        return '320x50'
      case 'article-top':
      case 'article-middle':
      case 'article-bottom':
      case 'native-feed':
        return '320x100'
      default:
        return 'responsive'
    }
  }

  if (breakpoint === 'tablet') {
    switch (position) {
      case 'header':
      case 'footer':
        return '728x90'
      case 'article-top':
      case 'article-middle':
      case 'article-bottom':
      case 'native-feed':
        return '300x250'
      default:
        return 'responsive'
    }
  }

  // Desktop
  switch (position) {
    case 'header':
    case 'footer':
      return '728x90'
    case 'sidebar-top':
    case 'sidebar-bottom':
      return '300x250'
    case 'sidebar-middle':
      return '300x600'
    case 'article-top':
    case 'article-middle':
    case 'article-bottom':
    case 'native-feed':
      return '336x280'
    default:
      return 'responsive'
  }
}

/**
 * Validate minimum distance between ads
 */
export function validateAdSpacing(placements: PlacementCoordinates[]): boolean {
  const minDistance = 250 // 250px minimum

  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const distance = Math.abs(placements[i].top - placements[j].top)
      
      if (distance < minDistance) {
        console.warn(`[AdPlacement] Ads too close: ${placements[i].position} and ${placements[j].position} (${distance}px < ${minDistance}px)`)
        return false
      }
    }
  }

  return true
}

/**
 * Generate CSS for ad placements
 */
export function generatePlacementCSS(placements: PlacementCoordinates[]): string {
  return placements.map(placement => {
    const selector = `.ad-${placement.position}`
    return `
${selector} {
  position: ${placement.isFixed ? 'fixed' : 'absolute'};
  top: ${placement.top}px;
  left: ${placement.left}px;
  width: ${placement.width}px;
  height: ${placement.height}px;
  z-index: ${placement.zIndex};
  margin: 20px 0;
}

@media (max-width: 768px) {
  ${selector} {
    width: calc(100% - 40px);
    left: 20px;
  }
}
    `.trim()
  }).join('\n\n')
}

/**
 * Get placement strategy summary
 */
export function getPlacementSummary(
  placements: PlacementCoordinates[],
  contentLayout: ContentLayout
): {
  totalPlacements: number
  byBreakpoint: Record<string, number>
  byPosition: Record<string, number>
  density: AdDensityCalculation
  isCompliant: boolean
  recommendations: string[]
} {
  const density = calculateAdDensity(placements, contentLayout)
  const spacingValid = validateAdSpacing(placements)

  const byBreakpoint = placements.reduce((acc, p) => {
    acc[p.breakpoint] = (acc[p.breakpoint] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const byPosition = placements.reduce((acc, p) => {
    acc[p.position] = (acc[p.position] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const recommendations: string[] = []

  if (!density.isCompliant) {
    recommendations.push(`⚠️ Ad density ${density.densityPercentage.toFixed(1)}% exceeds 30% limit`)
  }

  if (!spacingValid) {
    recommendations.push('⚠️ Some ads are too close together (min 250px required)')
  }

  if (placements.length < 3) {
    recommendations.push('💡 Consider adding more ad placements for better revenue')
  }

  if (placements.length > 8) {
    recommendations.push('⚠️ Too many ads may hurt user experience')
  }

  if (density.isCompliant && spacingValid) {
    recommendations.push('✅ All placements are compliant with AdSense policies')
  }

  return {
    totalPlacements: placements.length,
    byBreakpoint,
    byPosition,
    density,
    isCompliant: density.isCompliant && spacingValid,
    recommendations
  }
}
