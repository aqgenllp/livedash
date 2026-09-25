import React, { useRef } from 'react';
import { Box, type BoxProps } from '@mui/material';

interface DragScrollContainerProps extends BoxProps {
  children: React.ReactNode;
  speed?: number; // drag speed multiplier
}

const DragScrollContainer: React.FC<DragScrollContainerProps> = ({
  children,
  speed = 1.2,
  sx,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDown.current = true;
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeft.current = containerRef.current.scrollLeft;
  };

  const onMouseLeave = () => {
    isDown.current = false;
  };

  const onMouseUp = () => {
    isDown.current = false;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * speed;
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <Box
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      sx={{
        overflowX: 'auto',
        cursor: 'grab',
        userSelect: 'none',
        '&:active': { cursor: 'grabbing' },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};

export default DragScrollContainer;
