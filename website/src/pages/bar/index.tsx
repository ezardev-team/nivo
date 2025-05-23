import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import { patternDotsDef, patternLinesDef } from '@nivo/core'
import { ResponsiveBar, svgDefaultProps } from '@nivo/bar'
import { ComponentTemplate } from '../../components/components/ComponentTemplate'
import meta from '../../data/components/bar/meta.yml'
import { generateLightDataSet } from '../../data/components/bar/generator'
import mapper, { UnmappedBarProps, MappedBarProps } from '../../data/components/bar/mapper'
import { groups } from '../../data/components/bar/props'

const initialProperties: UnmappedBarProps = {
    indexBy: 'country',

    margin: {
        top: 50,
        right: 130,
        bottom: 50,
        left: 60,
    },

    padding: 0.3,
    innerPadding: 0,
    minValue: 'auto',
    maxValue: 'auto',

    groupMode: 'stacked',
    layout: 'vertical',
    reverse: false,

    valueScale: { type: 'linear' },
    indexScale: { type: 'band', round: true },
    valueFormat: { format: '', enabled: false },

    colors: { scheme: 'nivo' },
    colorBy: 'id',
    defs: [
        patternDotsDef('dots', {
            background: 'inherit',
            color: '#38bcb2',
            size: 4,
            padding: 1,
            stagger: true,
        }),
        patternLinesDef('lines', {
            background: 'inherit',
            color: '#eed312',
            rotation: -45,
            lineWidth: 6,
            spacing: 10,
        }),
    ],
    fill: [
        { match: { id: 'fries' }, id: 'dots' },
        { match: { id: 'sandwich' }, id: 'lines' },
    ],
    borderRadius: 0,
    borderWidth: 0,
    borderColor: {
        from: 'color',
        modifiers: [['darker', 1.6]],
    },

    axisTop: {
        enable: false,
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: '',
        legendOffset: 36,
        truncateTickAt: 0,
    },
    axisRight: {
        enable: false,
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: '',
        legendOffset: 0,
        truncateTickAt: 0,
    },
    axisBottom: {
        enable: true,
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'country',
        legendPosition: 'middle',
        legendOffset: 32,
        truncateTickAt: 0,
    },
    axisLeft: {
        enable: true,
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'food',
        legendPosition: 'middle',
        legendOffset: -40,
        truncateTickAt: 0,
    },

    enableGridX: false,
    enableGridY: true,

    enableLabel: true,
    enableTotals: false,
    totalsOffset: 10,
    labelSkipWidth: 12,
    labelSkipHeight: 12,
    labelTextColor: {
        from: 'color',
        modifiers: [['darker', 1.6]],
    },
    labelPosition: 'middle',
    labelOffset: 0,

    legends: [
        {
            dataFrom: 'keys',
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 120,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            symbolSize: 20,
            onClick: data => {
                alert(JSON.stringify(data, null, '    '))
            },
            effects: [
                {
                    on: 'hover',
                    style: {
                        itemOpacity: 1,
                    },
                },
            ],
        },
    ],

    isInteractive: true,
    'custom tooltip example': false,

    animate: true,
    motionConfig: 'default',

    role: 'application',
    isFocusable: false,
    ariaLabel: 'Nivo bar chart demo',
    barAriaLabel: data => `${data.id}: ${data.formattedValue} in country: ${data.indexValue}`,
}

const Bar = () => {
    const {
        image: {
            childImageSharp: { gatsbyImageData: image },
        },
    } = useStaticQuery(graphql`
        query {
            image: file(absolutePath: { glob: "**/src/assets/captures/bar.png" }) {
                childImageSharp {
                    gatsbyImageData(layout: FIXED, width: 700, quality: 100)
                }
            }
        }
    `)

    return (
        <ComponentTemplate<UnmappedBarProps, MappedBarProps, any>
            name="Bar"
            meta={meta.Bar}
            icon="bar"
            flavors={meta.flavors}
            currentFlavor="svg"
            properties={groups}
            initialProperties={initialProperties}
            defaultProperties={svgDefaultProps}
            propertiesMapper={mapper}
            codePropertiesMapper={(properties, data) => ({
                keys: data.keys,
                ...properties,
                tooltip: properties.tooltip ? 'CustomTooltip' : undefined,
            })}
            generateData={generateLightDataSet}
            getTabData={data => data.data}
            image={image}
        >
            {(properties, data, theme, logAction) => {
                return (
                    <ResponsiveBar
                        data={data.data}
                        keys={data.keys}
                        {...properties}
                        theme={theme}
                        onClick={node =>
                            logAction({
                                type: 'click',
                                label: `[bar] ${node.id} - ${node.indexValue}: ${node.value}`,
                                color: node.color,
                                data: node,
                            })
                        }
                    />
                )
            }}
        </ComponentTemplate>
    )
}

export default Bar
