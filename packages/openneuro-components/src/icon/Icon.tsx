import React from 'react'

import './icon.scss'

export interface IconProps {
  primary?: boolean
  secondary?: boolean
  backgroundColor?: string
  label?: string
  disabled?: boolean
  icon?: string
  color?: string
  imgSrc?: string
  iconSize?: string
  className?: string
}

export const Icon: React.FC<IconProps> = ({
  backgroundColor,
  label,
  icon,
  color,
  imgSrc,
  iconSize,
  className,
}) => {
  const iconWithText =
    icon && label ? 'icon-text' : imgSrc && label ? 'img-icon-text' : null
  const fontIcon = icon ? (
    <i style={{ fontSize: iconSize }} className={icon}></i>
  ) : null
  const imgIcon = imgSrc ? (
    <img style={{ width: iconSize }} src={imgSrc} alt="" />
  ) : null
  const wBackgroundColor = backgroundColor ? 'has-bg-color' : null

  return (
    <span
      className={[className, 'on-icon', iconWithText, wBackgroundColor].join(
        ' ',
      )}
      style={{ backgroundColor, color }}
      role="img">
      {imgIcon}
      {fontIcon}
      {label}
    </span>
  )
}
