interface SealProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  title?: string
}

/** 朱印：竖排两字，古典藏书印样式 */
export function Seal({ text = '唐音', size = 'md', className = '', title }: SealProps) {
  const cls = `seal seal-${size} ${className}`.trim()
  return (
    <span className={cls} title={title || text} aria-hidden="true">
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: size === 'lg' ? 1.08 : 1.12,
        }}
      >
        {[...text].map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </span>
    </span>
  )
}
