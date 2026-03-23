import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { GlossaryPage } from '@/features/glossary/components/GlossaryPage'

function renderGlossaryPage() {
  return render(
    <MemoryRouter>
      <GlossaryPage />
    </MemoryRouter>
  )
}

describe('GlossaryPage', () => {
  it('filters concepts by search term and opens the enriched concept detail', async () => {
    const user = userEvent.setup()

    renderGlossaryPage()

    const searchInput = screen.getByLabelText('Buscar concepto o definición')
    await user.type(searchInput, 'patri')

    const conceptTitle = await screen.findByText('Patrimonio Neto', { selector: 'h3' })
    const conceptCard = conceptTitle.closest('button')

    expect(conceptCard).not.toBeNull()
    expect(screen.queryByText('Cheque', { selector: 'h3' })).not.toBeInTheDocument()

    await user.click(conceptCard!)

    const detailHeading = screen.getByText('Patrimonio Neto', { selector: 'h2' })
    const detailPanel = detailHeading.closest('section')

    expect(detailHeading).toBeInTheDocument()
    expect(detailPanel).not.toBeNull()
    expect(
      within(detailPanel!).getByText(/surge de la diferencia entre el Activo y el Pasivo/i)
    ).toBeInTheDocument()
    expect(within(detailPanel!).getByText('Ejemplo')).toBeInTheDocument()
    expect(
      within(detailPanel!).getByText(/si una empresa tiene un Activo de \$100\.000/i)
    ).toBeInTheDocument()
  })

  it('finds concepts by extended detail content, not only by term', async () => {
    const user = userEvent.setup()

    renderGlossaryPage()

    const searchInput = screen.getByLabelText('Buscar concepto o definición')
    await user.type(searchInput, 'llave de negocio')

    expect(await screen.findByText('Activo', { selector: 'h3' })).toBeInTheDocument()
  })
})
