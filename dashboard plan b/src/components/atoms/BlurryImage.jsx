import React, { useState, useEffect } from 'react';

/**
 * BlurryImage - A premium image component that displays a blurred shimmer loading
 * placeholder and transitions smoothly to the full image once it is loaded.
 */
export const BlurryImage = ({
  src,
  alt = '',
  className = '',
  style = {},
  placeholderColor = '#f1f5f9',
  onClick,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');

  // Reset load state when source changes
  useEffect(() => {
    if (src) {
      setIsLoaded(false);
      setCurrentSrc(src);
    } else {
      setIsLoaded(false);
      setCurrentSrc('');
    }
  }, [src]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (props.onLoad) {
      props.onLoad(e);
    }
  };

  // If there's no src, render a static skeleton/placeholder block matching the dimensions
  if (!src) {
    return (
      <div
        className={`
          blurry-image-container blurry-image-placeholder-only ${className}`}
        style={{
          backgroundColor: placeholderColor,
          ...style,
          objectFit: "cover"
        }}
        onClick={onClick}
      />
    );
  }

  // Segment style properties: standard structural properties go to the wrapper,
  // while object-fit and specific styling stays on the image.
  const wrapperStyles = {
    position: style.position || 'relative',
    overflow: 'hidden',
    display: style.display || 'inline-block',
    width: style.width,
    height: style.height,
    borderRadius: style.borderRadius,
    border: style.border,
    margin: style.margin,
    marginTop: style.marginTop,
    marginBottom: style.marginBottom,
    marginLeft: style.marginLeft,
    marginRight: style.marginRight,
    flexShrink: style.flexShrink,
    ...style,
  };

  const imgStyles = {
    width: '100%',
    height: '100%',
    objectFit: style.objectFit || 'cover',
    borderRadius: style.borderRadius,
    ...props.style,
  };

  return (
    <div className={`blurry-image-container ${className}`} style={wrapperStyles} onClick={onClick}>
      {!isLoaded && (
        <div
          className="blurry-image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: placeholderColor,
            zIndex: 1,
          }}
        />
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`blurry-image-el ${isLoaded ? 'loaded' : ''}`}
        onLoad={handleLoad}
        style={imgStyles}
        {...props}
      />
    </div>
  );
};

export default BlurryImage;
