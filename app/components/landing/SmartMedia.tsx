"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

export interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "onLoad"> {
  src: string;
  alt: string;
  wrapperClassName?: string;
}

export function SmartImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  loading = "lazy",
  decoding = "async",
  ...rest
}: SmartImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  return (
    <span className={`relative block overflow-hidden bg-[#05080C] ${wrapperClassName}`}>
      {!loaded && (
        <span
          aria-hidden="true"
          className="gyra-smart-shimmer pointer-events-none absolute inset-0 z-10"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`transition-opacity duration-300 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        {...rest}
      />
    </span>
  );
}

export function useSmartPreload(urls: readonly string[]): void {
  const key = urls.join("|");
  useEffect(() => {
    if (typeof window === "undefined" || !key) return;
    const list = key.split("|").filter(Boolean);
    const images = list.map((url) => {
      const img = new window.Image();
      img.decoding = "async";
      img.src = url;
      return img;
    });
    return () => {
      images.forEach((img) => {
        img.src = "";
      });
    };
  }, [key]);
}
