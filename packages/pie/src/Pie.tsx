import { ReactNode, Fragment, createElement } from 'react'
import {
    // @ts-ignore
    bindDefs,
    useDimensions,
    Container,
    SvgWrapper,
} from '@nivo/core'
import { ArcLabelsLayer, ArcLinkLabelsLayer } from '@nivo/arcs'
import { InheritedColorConfig } from '@nivo/colors'
import { PieLegends } from './PieLegends'
import { useNormalizedData, usePieFromBox, usePieLayerContext } from './hooks'
import { ComputedDatum, PieLayer, PieSvgProps, PieLayerId, MayHaveLabel } from './types'
import { defaultProps } from './props'
import { Arcs } from './Arcs'

const InnerPie = <RawDatum extends MayHaveLabel>({
    data,
    id = defaultProps.id,
    value = defaultProps.value,
    valueFormat,
    sortByValue = defaultProps.sortByValue,

    layers = defaultProps.layers as PieLayer<RawDatum>[],

    startAngle = defaultProps.startAngle,
    endAngle = defaultProps.endAngle,
    padAngle = defaultProps.padAngle,
    fit = defaultProps.fit,
    innerRadius: innerRadiusRatio = defaultProps.innerRadius,
    cornerRadius = defaultProps.cornerRadius,
    activeInnerRadiusOffset = defaultProps.activeInnerRadiusOffset,
    activeOuterRadiusOffset = defaultProps.activeOuterRadiusOffset,

    width,
    height,
    margin: partialMargin,

    colors = defaultProps.colors,

    // border
    borderWidth = defaultProps.borderWidth,
    borderColor = defaultProps.borderColor as InheritedColorConfig<ComputedDatum<RawDatum>>,

    // arc labels
    enableArcLabels = defaultProps.enableArcLabels,
    arcLabel = defaultProps.arcLabel,
    arcLabelsSkipAngle = defaultProps.arcLabelsSkipAngle,
    arcLabelsSkipRadius = defaultProps.arcLabelsSkipRadius,
    arcLabelsTextColor = defaultProps.arcLabelsTextColor,
    arcLabelsRadiusOffset = defaultProps.arcLabelsRadiusOffset,
    arcLabelsComponent,

    // arc link labels
    enableArcLinkLabels = defaultProps.enableArcLinkLabels,
    arcLinkLabel = defaultProps.arcLinkLabel,
    arcLinkLabelsSkipAngle = defaultProps.arcLinkLabelsSkipAngle,
    arcLinkLabelsOffset = defaultProps.arcLinkLabelsOffset,
    arcLinkLabelsDiagonalLength = defaultProps.arcLinkLabelsDiagonalLength,
    arcLinkLabelsStraightLength = defaultProps.arcLinkLabelsStraightLength,
    arcLinkLabelsThickness = defaultProps.arcLinkLabelsThickness,
    arcLinkLabelsTextOffset = defaultProps.arcLinkLabelsTextOffset,
    arcLinkLabelsTextColor = defaultProps.arcLinkLabelsTextColor,
    arcLinkLabelsColor = defaultProps.arcLinkLabelsColor,
    arcLinkLabelComponent,

    // styling
    defs = defaultProps.defs,
    fill = defaultProps.fill,

    // interactivity
    isInteractive = defaultProps.isInteractive,
    onClick,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    tooltip = defaultProps.tooltip,
    activeId: activeIdFromProps,
    onActiveIdChange,
    defaultActiveId,

    transitionMode = defaultProps.transitionMode,

    legends = defaultProps.legends,
    forwardLegendData,

    role = defaultProps.role,
}: PieSvgProps<RawDatum>) => {
    const { outerWidth, outerHeight, margin, innerWidth, innerHeight } = useDimensions(
        width,
        height,
        partialMargin
    )

    const normalizedData = useNormalizedData<RawDatum>({
        data,
        id,
        value,
        valueFormat,
        colors,
    })

    const {
        dataWithArc,
        legendData,
        arcGenerator,
        centerX,
        centerY,
        radius,
        innerRadius,
        setActiveId,
        toggleSerie,
    } = usePieFromBox<RawDatum>({
        data: normalizedData,
        width: innerWidth,
        height: innerHeight,
        fit,
        innerRadius: innerRadiusRatio,
        startAngle,
        endAngle,
        padAngle,
        sortByValue,
        cornerRadius,
        activeInnerRadiusOffset,
        activeOuterRadiusOffset,
        activeId: activeIdFromProps,
        onActiveIdChange,
        defaultActiveId,
        forwardLegendData,
    })

    const boundDefs = bindDefs(defs, dataWithArc, fill)

    const layerById: Record<PieLayerId, ReactNode> = {
        arcs: null,
        arcLinkLabels: null,
        arcLabels: null,
        legends: null,
    }

    if (layers.includes('arcs')) {
        layerById.arcs = (
            <Arcs<RawDatum>
                key="arcs"
                center={[centerX, centerY]}
                data={dataWithArc}
                arcGenerator={arcGenerator}
                borderWidth={borderWidth}
                borderColor={borderColor}
                isInteractive={isInteractive}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                setActiveId={setActiveId}
                tooltip={tooltip}
                transitionMode={transitionMode}
            />
        )
    }

    if (enableArcLinkLabels && layers.includes('arcLinkLabels')) {
        layerById.arcLinkLabels = (
            <ArcLinkLabelsLayer<ComputedDatum<RawDatum>>
                key="arcLinkLabels"
                center={[centerX, centerY]}
                data={dataWithArc}
                label={arcLinkLabel}
                skipAngle={arcLinkLabelsSkipAngle}
                offset={arcLinkLabelsOffset}
                diagonalLength={arcLinkLabelsDiagonalLength}
                straightLength={arcLinkLabelsStraightLength}
                strokeWidth={arcLinkLabelsThickness}
                textOffset={arcLinkLabelsTextOffset}
                textColor={arcLinkLabelsTextColor}
                linkColor={arcLinkLabelsColor}
                component={arcLinkLabelComponent}
            />
        )
    }

    if (enableArcLabels && layers.includes('arcLabels')) {
        layerById.arcLabels = (
            <ArcLabelsLayer<ComputedDatum<RawDatum>>
                key="arcLabels"
                center={[centerX, centerY]}
                data={dataWithArc}
                label={arcLabel}
                radiusOffset={arcLabelsRadiusOffset}
                skipAngle={arcLabelsSkipAngle}
                skipRadius={arcLabelsSkipRadius}
                textColor={arcLabelsTextColor}
                transitionMode={transitionMode}
                component={arcLabelsComponent}
            />
        )
    }

    if (legends.length > 0 && layers.includes('legends')) {
        layerById.legends = (
            <PieLegends<RawDatum>
                key="legends"
                width={innerWidth}
                height={innerHeight}
                data={legendData}
                legends={legends}
                toggleSerie={toggleSerie}
            />
        )
    }

    const layerContext = usePieLayerContext<RawDatum>({
        dataWithArc,
        arcGenerator,
        centerX,
        centerY,
        radius,
        innerRadius,
    })

    return (
        <SvgWrapper
            width={outerWidth}
            height={outerHeight}
            margin={margin}
            defs={boundDefs}
            role={role}
        >
            {layers.map((layer, i) => {
                if (layerById[layer as PieLayerId] !== undefined) {
                    return layerById[layer as PieLayerId]
                }

                if (typeof layer === 'function') {
                    return <Fragment key={i}>{createElement(layer, layerContext)}</Fragment>
                }

                return null
            })}
        </SvgWrapper>
    )
}

export const Pie = <RawDatum extends MayHaveLabel>({
    isInteractive = defaultProps.isInteractive,
    animate = defaultProps.animate,
    motionConfig = defaultProps.motionConfig,
    theme,
    renderWrapper,
    ...otherProps
}: PieSvgProps<RawDatum>) => (
    <Container
        {...{
            animate,
            isInteractive,
            motionConfig,
            renderWrapper,
            theme,
        }}
    >
        <InnerPie<RawDatum> isInteractive={isInteractive} {...otherProps} />
    </Container>
)
