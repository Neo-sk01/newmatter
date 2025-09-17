import { describe, it, expect } from 'vitest'
import { renderTemplate } from '@/lib/promptTemplates'

describe('renderTemplate', () => {
  it('replaces simple variables', () => {
    const out = renderTemplate('Hello {{name}} from {{place}}', { name: 'Neo', place: 'Joburg' })
    expect(out).toBe('Hello Neo from Joburg')
  })

  it('handles missing and null values as empty string', () => {
    const out = renderTemplate('Hi {{name}} {{missing}} {{n}}', { name: 'Moe', missing: undefined, n: null })
    expect(out).toBe('Hi Moe  ')
  })

  it('supports numeric values', () => {
    const out = renderTemplate('Count: {{n}}', { n: 42 })
    expect(out).toBe('Count: 42')
  })
})

