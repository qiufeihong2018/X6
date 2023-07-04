import React, { useEffect, useRef, useState } from 'react'
import { Graph, Node, Edge } from '@antv/x6'
const X6Graph = () => {
  const containerRef = useRef(null)
  const [data, setData] = useState([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const graph = new Graph({
      container,
      width: container.clientWidth,
      height: container.clientHeight,
      background: {
        color: '#f9f9f9',
      },
    })

    const items = Array.from({ length: 100 }, (_, i) => ({
      id: `node${i + 1}`,
      shape: 'rect',
      position: { x: 50, y: (i + 1) * 50 },
      size: { width: 80, height: 40 },
      label: `Node ${i + 1}`,
    }))

    setData(items)

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const node = items.find((item) => item.id === entry.target.id)
          const { shape, position, size, label } = node
          graph.addNode(
            new Node({
              shape,
              position,
              size,
              label: {
                text: label,
                position: 'center',
              },
            }),
          )
          observer.unobserve(entry.target)
        }
      })
    })

    Array.from(container.children).forEach((nodeElement) => {
      observer.observe(nodeElement)
    })

    return () => {
      graph.dispose()
    }
  }, [])

  return (
    <div ref={containerRef} style={{ height: '600px', overflow: 'auto' }}>
      {data.map(({ id, position, size, label }) => (
        <div
          key={id}
          id={id}
          style={{
            position: 'relative',
            height: `${size.height}px`,
            background: '#fff',
            border: '1px solid #aaa',
            textAlign: 'center',
            lineHeight: `${size.height}px`,
          }}
        >
          {label}
        </div>
      ))}
    </div>
  )
}

export default X6Graph
