import React, { useCallback } from 'react'
import { ColorInterpolatorId } from '@nivo/colors'
import { ChartProperty, Flavor } from '../../../types'
import { ControlContext, ColorInterpolatorsControlConfig } from '../types'
import { Control, PropertyHeader, Help, Select } from '../ui'
import {
    ColorSchemeSelectOption,
    ColorSchemeSelectValue,
    useColorInterpolators,
} from './colorSchemeSelect'

export type ColorInterpolatorOption = ReturnType<typeof useColorInterpolators>[number]

interface OrdinalColorsControlProps {
    id: string
    property: ChartProperty
    flavors: Flavor[]
    currentFlavor: Flavor
    config: ColorInterpolatorsControlConfig
    value: ColorInterpolatorId
    onChange: (value: ColorInterpolatorId) => void
    context?: ControlContext
}

export const ColorInterpolatorsControl = ({
    id,
    property,
    flavors,
    currentFlavor,
    value: _value,
    onChange,
    context,
}: OrdinalColorsControlProps) => {
    const options = useColorInterpolators()

    const handleChange = useCallback(
        (value: ColorInterpolatorOption | null) => onChange(value!.value),
        [onChange]
    )
    const value = options.find(({ value: v }) => v === _value)

    return (
        <Control
            id={id}
            description={property.description}
            flavors={flavors}
            currentFlavor={currentFlavor}
            supportedFlavors={property.flavors}
        >
            <PropertyHeader {...property} context={context} />
            <Select<ColorInterpolatorOption>
                options={options}
                onChange={handleChange}
                value={value}
                isSearchable
                isClearable={false}
                components={{
                    SingleValue: ColorSchemeSelectValue,
                    Option: ColorSchemeSelectOption,
                }}
            />
            <Help>{property.help}</Help>
        </Control>
    )
}
