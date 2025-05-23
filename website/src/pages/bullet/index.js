import React from 'react'
import shuffle from 'lodash/shuffle.js'
import { ResponsiveBullet, defaultProps } from '@nivo/bullet'
import { generateBulletData } from '@nivo/generators'
import { ComponentTemplate } from '../../components/components/ComponentTemplate'
import meta from '../../data/components/bullet/meta.yml'
import { groups } from '../../data/components/bullet/props'
import { graphql, useStaticQuery } from 'gatsby'

const generateData = () => [
    generateBulletData('temp.', shuffle([100, 120, 140])[0]),
    generateBulletData('power', 2, { float: true, measureCount: 2 }),
    generateBulletData('volume', shuffle([40, 60, 80])[0], { rangeCount: 8 }),
    generateBulletData('cost', 500000, { measureCount: 2 }),
    generateBulletData('revenue', shuffle([9, 11, 13])[0], { markerCount: 2 }),
]

const initialProperties = {
    minValue: defaultProps.minValue,
    maxValue: defaultProps.maxValue,
    margin: {
        top: 50,
        right: 90,
        bottom: 50,
        left: 90,
    },
    layout: defaultProps.layout,
    reverse: defaultProps.reverse,
    spacing: 46,
    titlePosition: defaultProps.titlePosition,
    titleAlign: 'start',
    titleOffsetX: -70,
    titleOffsetY: defaultProps.titleOffsetY,
    titleRotation: defaultProps.titleRotation,
    rangeBorderColor: defaultProps.rangeBorderColor,
    rangeBorderWidth: defaultProps.rangeBorderWidth,
    measureBorderColor: defaultProps.measureBorderColor,
    measureBorderWidth: defaultProps.measureBorderWidth,
    measureSize: 0.2,
    markerSize: 0.6,
    axisPosition: defaultProps.axisPosition,
    rangeColors: defaultProps.rangeColors,
    measureColors: defaultProps.measureColors,
    markerColors: defaultProps.markerColors,
    animate: defaultProps.animate,
    motionConfig: defaultProps.motionConfig,
}

const Bullet = () => {
    const {
        image: {
            childImageSharp: { gatsbyImageData: image },
        },
    } = useStaticQuery(graphql`
        query {
            image: file(absolutePath: { glob: "**/src/assets/captures/bullet.png" }) {
                childImageSharp {
                    gatsbyImageData(layout: FIXED, width: 700, quality: 100)
                }
            }
        }
    `)

    return (
        <ComponentTemplate
            name="Bullet"
            meta={meta.Bullet}
            icon="bullet"
            flavors={meta.flavors}
            currentFlavor="svg"
            properties={groups}
            initialProperties={initialProperties}
            defaultProperties={defaultProps}
            generateData={generateData}
            image={image}
        >
            {(properties, data, theme, logAction) => {
                return (
                    <ResponsiveBullet
                        data={data}
                        {...properties}
                        theme={theme}
                        onRangeClick={range => {
                            logAction({
                                type: 'click',
                                label: `[range] ${range.id}: [${range.v0}, ${range.v1}]`,
                                color: range.color,
                                data: range,
                            })
                        }}
                        onMeasureClick={measure => {
                            logAction({
                                type: 'click',
                                label: `[measure] ${measure.id}: [${measure.v0}, ${measure.v1}]`,
                                color: measure.color,
                                data: measure,
                            })
                        }}
                        onMarkerClick={marker => {
                            logAction({
                                type: 'click',
                                label: `[marker] ${marker.id}: ${marker.value}`,
                                color: marker.color,
                                data: marker,
                            })
                        }}
                    />
                )
            }}
        </ComponentTemplate>
    )
}

export default Bullet
