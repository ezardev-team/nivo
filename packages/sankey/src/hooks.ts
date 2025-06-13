import { useState, useMemo } from 'react'
import cloneDeep from 'lodash/cloneDeep.js'
import { sankey as d3Sankey } from 'd3-sankey'
import { usePropertyAccessor, useValueFormatter } from '@nivo/core'
import { useTheme } from '@nivo/theming'
import { useOrdinalColorScale, useInheritedColor } from '@nivo/colors'
import { sankeyAlignmentFromProp } from './props'
import {
    DefaultLink,
    DefaultNode,
    SankeyAlignFunction,
    SankeyCommonProps,
    SankeyDataProps,
    SankeyLinkDatum,
    SankeyNodeDatum,
    SankeySortFunction,
} from './types'

const getId = <N extends DefaultNode>(node: N) => node.id

export const computeNodeAndLinks = <N extends DefaultNode, L extends DefaultLink>({
    data: _data,
    formatValue,
    layout,
    alignFunction,
    sortFunction,
    linkSortMode,
    nodeThickness,
    nodeSpacing,
    spacingIncrease,
    nodeInnerPadding,
    width,
    height,
    getColor,
    getLabel,
}: {
    data: SankeyDataProps<N, L>['data']
    formatValue: (value: number) => string
    layout: SankeyCommonProps<N, L>['layout']
    alignFunction: SankeyAlignFunction
    sortFunction: null | undefined | SankeySortFunction<N, L>
    linkSortMode: null | undefined
    nodeThickness: SankeyCommonProps<N, L>['nodeThickness']
    nodeSpacing: SankeyCommonProps<N, L>['nodeSpacing']
    spacingIncrease: SankeyCommonProps<N, L>['spacingIncrease']
    nodeInnerPadding: SankeyCommonProps<N, L>['nodeInnerPadding']
    width: number
    height: number
    getColor: (node: Omit<SankeyNodeDatum<N, L>, 'color' | 'label'>) => string
    getLabel: (node: Omit<SankeyNodeDatum<N, L>, 'color' | 'label'>) => string
}) => {
    const sankey = d3Sankey()
        .nodeAlign(alignFunction)
        // @ts-expect-error: this method signature is incorrect in current @types/d3-sankey
        .nodeSort(sortFunction)
        // @ts-expect-error: this method is not available in current @types/d3-sankey
        .linkSort(linkSortMode)
        .nodeWidth(nodeThickness)
        .nodePadding(nodeSpacing)
        .size(layout === 'horizontal' ? [width, height] : [height, width])
        .nodeId(getId)

    // deep clone is required as the sankey diagram mutates data
    // we need a different identity for correct updates
    const data = cloneDeep(_data) as unknown as {
        nodes: SankeyNodeDatum<N, L>[]
        links: SankeyLinkDatum<N, L>[]
    }
    sankey(data)

    const totalLayer = Math.max(...data.nodes.map(node => node.layer))
    const centerLayer = Math.floor(totalLayer / 2)

    data.nodes.forEach(node => {
        node.gap = (node.gap ?? 0) + spacingIncrease * Math.abs(centerLayer - node.layer)
    })

    let layerDiffMap: Record<string, number> = {}

    data.nodes.forEach(node => {
        if (!Object.keys(layerDiffMap).find(layer => layer === node.layer.toString())) {
            const nodesAtSameDepth = data.nodes.filter(n => n.layer === node.layer)
            const firstNodeAtSameDepth = nodesAtSameDepth.reduce(
                (acc, n) => {
                    if (!acc) return n
                    return n.y0 < acc.y0 ? n : acc
                },
                null as SankeyNodeDatum<N, L> | null
            )

            const yDiff = firstNodeAtSameDepth?.y0
            const currentLayer = node.layer
            if (!firstNodeAtSameDepth || currentLayer === undefined || yDiff === undefined) {
                return
            }

            layerDiffMap = {
                ...layerDiffMap,
                [currentLayer.toString()]: yDiff,
            }
        }

        node.y = node.y - layerDiffMap[node.layer.toString()]
        node.y0 = node.y0 - layerDiffMap[node.layer.toString()]
        node.y1 = node.y1 - layerDiffMap[node.layer.toString()]
    })


    data.nodes.forEach(node => {
        node.color = getColor(node)
        node.label = getLabel(node)
        node.formattedValue = formatValue(node.value)

        const nodesAtSameDepth = data.nodes.filter(n => n.layer === node.layer)
        const lastNodeAtSameDepth = nodesAtSameDepth.reduce((acc, n) => {
            return n.y0 < node.y0 && n.y0 > (acc?.y0 || -Infinity) ? n : acc
        }, null as SankeyNodeDatum<N, L> | null)

        const newMargin = (lastNodeAtSameDepth?.gap || 0) + (node.gap || 0)

        if (layout === 'horizontal') {
            node.x = node.x0 + nodeInnerPadding
            node.y = node.y0 + newMargin
            node.gap = newMargin
            node.width = Math.max(node.x1 - node.x0 - nodeInnerPadding * 2, 0)
            node.height = Math.max(node.y1 - node.y0, 0)
        } else {
            node.x = node.y0
            node.y = node.x0 + nodeInnerPadding + newMargin
            node.gap = newMargin
            node.width = Math.max(node.y1 - node.y0, 0)
            node.height = Math.max(node.x1 - node.x0 - nodeInnerPadding * 2 - newMargin * 2, 0)

            const oldX0 = node.x0
            const oldX1 = node.x1

            node.x0 = node.y0
            node.x1 = node.y1
            node.y0 = oldX0
            node.y1 = oldX1
        }
    })

    const maxY1 = Math.max(...data.nodes.map(node => node.y1))

    data.nodes.forEach(node => {
        const nodesAtSameDepth = data.nodes.filter(n => n.layer === node.layer)
        const maxY1AtSameDepth = Math.max(...nodesAtSameDepth.map(n => n.y1))
        const y1Diff = maxY1 - maxY1AtSameDepth

        let nodesLength = nodesAtSameDepth.length

        const lastNodeAtSameDepth = nodesAtSameDepth.reduce(
            (acc, n) => {
                return n.y0 < node.y0 && n.y0 > (acc?.y0 || -Infinity) ? n : acc
            },
            null as SankeyNodeDatum<N, L> | null
        )

        let newMargin = (lastNodeAtSameDepth?.gap || 0) + (node.gap || 0)

        if (node.y0 != 0 && nodesLength > 1) {
            newMargin += y1Diff / (nodesLength - 1)
        } else if (nodesLength === 1) {
            const centerY = maxY1 / 2
            const nodeCenter = node.y0 + node.height / 2
            newMargin = centerY - nodeCenter
        }

        node.y = node.y + newMargin
        node.gap = node.gap + newMargin
    })

    data.links.forEach(link => {
        link.formattedValue = formatValue(link.value)
        link.color = link.color || link.source.color

        // Adjust link positions based on node margins
        if (layout === 'horizontal') {
            // @ts-expect-error: @types/d3-sankey
            link.pos0 = link.y0 + link.source.gap - layerDiffMap[link.source.layer.toString()]
            // @ts-expect-error: @types/d3-sankey
            link.pos1 = link.y1 + link.target.gap - layerDiffMap[link.target.layer.toString()]
        } else {
            // @ts-expect-error: @types/d3-sankey
            link.pos0 = link.y0 + link.source.gap - layerDiffMap[link.source.layer.toString()]
            // @ts-expect-error: @types/d3-sankey
            link.pos1 = link.y1 + link.target.gap - layerDiffMap[link.target.layer.toString()]
        }

        // @ts-expect-error: @types/d3-sankey
        link.thickness = link.width
        // @ts-expect-error: @types/d3-sankey
        delete link.y0
        // @ts-expect-error: @types/d3-sankey
        delete link.y1
        // @ts-expect-error: @types/d3-sankey
        delete link.width
    })

    return data
}

export const useSankey = <N extends DefaultNode, L extends DefaultLink>({
    data,
    valueFormat,
    layout,
    width,
    height,
    sort,
    align,
    colors,
    nodeThickness,
    nodeSpacing,
    spacingIncrease,
    nodeInnerPadding,
    nodeBorderColor,
    label,
    labelTextColor,
}: {
    data: SankeyDataProps<N, L>['data']
    valueFormat?: SankeyCommonProps<N, L>['valueFormat']
    layout: SankeyCommonProps<N, L>['layout']
    width: number
    height: number
    sort: SankeyCommonProps<N, L>['sort']
    align: SankeyCommonProps<N, L>['align']
    colors: SankeyCommonProps<N, L>['colors']
    nodeThickness: SankeyCommonProps<N, L>['nodeThickness']
    nodeSpacing: SankeyCommonProps<N, L>['nodeSpacing']
    spacingIncrease: SankeyCommonProps<N, L>['spacingIncrease']
    nodeInnerPadding: SankeyCommonProps<N, L>['nodeInnerPadding']
    nodeBorderColor: SankeyCommonProps<N, L>['nodeBorderColor']
    label: SankeyCommonProps<N, L>['label']
    labelTextColor: SankeyCommonProps<N, L>['labelTextColor']
}) => {
    const [currentNode, setCurrentNode] = useState<SankeyNodeDatum<N, L> | null>(null)
    const [currentLink, setCurrentLink] = useState<SankeyLinkDatum<N, L> | null>(null)

    const sortFunction = useMemo(() => {
        if (sort === 'auto') return undefined
        if (sort === 'input') return null
        if (sort === 'ascending') {
            return (a: SankeyNodeDatum<N, L>, b: SankeyNodeDatum<N, L>) => a.value - b.value
        }
        if (sort === 'descending') {
            return (a: SankeyNodeDatum<N, L>, b: SankeyNodeDatum<N, L>) => b.value - a.value
        }

        return sort
    }, [sort])

    // If "input" sorting is used, apply this setting to links, too.
    // (In d3, `null` means input sorting and `undefined` is the default)
    const linkSortMode = sort === 'input' ? null : undefined

    const alignFunction = useMemo(() => {
        if (typeof align === 'function') return align
        return sankeyAlignmentFromProp(align)
    }, [align])

    const theme = useTheme()

    const getColor = useOrdinalColorScale(colors, 'id')
    const getNodeBorderColor = useInheritedColor(nodeBorderColor, theme)

    const getLabel = usePropertyAccessor<Omit<SankeyNodeDatum<N, L>, 'color' | 'label'>, string>(
        label
    )
    const getLabelTextColor = useInheritedColor(labelTextColor, theme)
    const formatValue = useValueFormatter<number>(valueFormat)

    const { nodes, links } = useMemo(
        () =>
            computeNodeAndLinks<N, L>({
                data,
                formatValue,
                layout,
                alignFunction,
                sortFunction,
                linkSortMode,
                nodeThickness,
                nodeSpacing,
                spacingIncrease,
                nodeInnerPadding,
                width,
                height,
                getColor,
                getLabel,
            }),
        [
            data,
            formatValue,
            layout,
            alignFunction,
            sortFunction,
            linkSortMode,
            nodeThickness,
            nodeSpacing,
            spacingIncrease,
            nodeInnerPadding,
            width,
            height,
            getColor,
            getLabel,
        ]
    )

    const legendData = useMemo(
        () =>
            nodes.map(node => ({
                id: node.id,
                label: node.label,
                color: node.color,
            })),
        [nodes]
    )

    return {
        nodes,
        links,
        legendData,
        getNodeBorderColor,
        currentNode,
        setCurrentNode,
        currentLink,
        setCurrentLink,
        getLabelTextColor,
    }
}
