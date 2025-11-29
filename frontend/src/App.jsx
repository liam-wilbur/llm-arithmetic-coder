import { useState, useRef, useEffect } from 'react'

function App() {
  const [compressInput, setCompressInput] = useState('')
  const [compressOutput, setCompressOutput] = useState('')
  const [compressProgress, setCompressProgress] = useState(null)
  const [decompressInput, setDecompressInput] = useState('')
  const [decompressOutput, setDecompressOutput] = useState('')
  const [decompressProgress, setDecompressProgress] = useState(null)
  
  const compressOutputRef = useRef(null)
  const decompressOutputRef = useRef(null)

  // Auto-scroll outputs to bottom when content changes
  useEffect(() => {
    if (compressOutputRef.current) {
      compressOutputRef.current.scrollTop = compressOutputRef.current.scrollHeight
    }
  }, [compressOutput])

  useEffect(() => {
    if (decompressOutputRef.current) {
      decompressOutputRef.current.scrollTop = decompressOutputRef.current.scrollHeight
    }
  }, [decompressOutput])

  const handleCompress = async () => {
    setCompressOutput('')
    setCompressProgress(0)
    
    const res = await fetch('http://localhost:8000/compress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compressInput)
    })
    
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '))
      
      for (const line of lines) {
        const data = JSON.parse(line.slice(6))
        setCompressProgress(data.progress)
        if (data.result) {
          setCompressOutput(data.result)
          setCompressProgress(null)
        }
      }
    }
  }

  const handleDecompress = async () => {
    setDecompressOutput('')
    setDecompressProgress(0)
    
    const res = await fetch('http://localhost:8000/decompress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decompressInput)
    })
    
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '))
      
      for (const line of lines) {
        const data = JSON.parse(line.slice(6))
        setDecompressProgress(data.progress)
        if (data.chunk) {
          setDecompressOutput(prev => prev + data.chunk)
        }
        if (data.result !== undefined) {
          setDecompressOutput(data.result)
          setDecompressProgress(null)
        }
      }
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>LM Compress</h1>
      
      <div style={styles.row}>
        <div style={styles.section}>
          <h2 style={styles.heading}>Compress</h2>
          <textarea
            style={styles.textarea}
            value={compressInput}
            onChange={e => setCompressInput(e.target.value)}
            placeholder="Text to compress..."
          />
          <div style={styles.buttons}>
            <button style={styles.button} onClick={handleCompress} disabled={compressProgress !== null}>
              {compressProgress !== null ? 'Compressing...' : 'Compress'}
            </button>
            <button style={styles.clearButton} onClick={() => setCompressOutput('')}>Clear</button>
          </div>
          {compressProgress !== null && (
            <div style={styles.progressContainer}>
              <div style={{...styles.progressBar, width: `${compressProgress * 100}%`}} />
              <span style={styles.progressText}>{Math.round(compressProgress * 100)}%</span>
            </div>
          )}
          {compressOutput && <pre ref={compressOutputRef} style={styles.output}>{compressOutput}</pre>}
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>Decompress</h2>
          <textarea
            style={styles.textarea}
            value={decompressInput}
            onChange={e => setDecompressInput(e.target.value)}
            placeholder="Text to decompress..."
          />
          <div style={styles.buttons}>
            <button style={styles.button} onClick={handleDecompress} disabled={decompressProgress !== null}>
              {decompressProgress !== null ? 'Decompressing...' : 'Decompress'}
            </button>
            <button style={styles.clearButton} onClick={() => setDecompressOutput('')}>Clear</button>
          </div>
          {decompressProgress !== null && (
            <div style={styles.progressContainer}>
              <div style={{...styles.progressBar, width: `${decompressProgress * 100}%`}} />
              <span style={styles.progressText}>{Math.round(decompressProgress * 100)}%</span>
            </div>
          )}
          {decompressOutput && <pre ref={decompressOutputRef} style={styles.output}>{decompressOutput}</pre>}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: 40,
    fontFamily: 'system-ui, sans-serif',
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    marginBottom: 32,
    color: '#1a1a1a',
  },
  row: {
    display: 'flex',
    gap: 32,
  },
  section: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: 500,
    color: '#444',
    margin: 0,
  },
  textarea: {
    width: '100%',
    height: 150,
    padding: 12,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 6,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  buttons: {
    display: 'flex',
    gap: 8,
  },
  button: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    color: '#fff',
    background: '#2563eb',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  clearButton: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    color: '#666',
    background: '#e5e5e5',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  output: {
    padding: 12,
    background: '#f5f5f5',
    borderRadius: 6,
    fontSize: 13,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    margin: 0,
    maxHeight: 300,
    overflowY: 'auto',
  },
  progressContainer: {
    position: 'relative',
    height: 24,
    background: '#e5e5e5',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
    transition: 'width 0.1s ease-out',
  },
  progressText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 12,
    fontWeight: 600,
    color: '#1a1a1a',
  },
}

export default App
