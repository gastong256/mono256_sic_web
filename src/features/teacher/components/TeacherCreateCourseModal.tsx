import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'

type TeacherCreateCourseModalProps = {
  errorMessage: string | null
  isOpen: boolean
  isSubmitting: boolean
  name: string
  code: string
  onClose: () => void
  onCodeChange: (value: string) => void
  onNameChange: (value: string) => void
  onSubmit: () => void
}

export function TeacherCreateCourseModal({
  errorMessage,
  isOpen,
  isSubmitting,
  name,
  code,
  onClose,
  onCodeChange,
  onNameChange,
  onSubmit,
}: TeacherCreateCourseModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear nuevo curso" className="max-w-lg">
      <div className="space-y-4">
        {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
        <Input
          label="Nombre del curso"
          placeholder="Ej: Contabilidad II"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <Input
          label="Codigo (opcional)"
          placeholder="Ej: CONT-II"
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            isLoading={isSubmitting}
            onClick={() => {
              onSubmit()
            }}
          >
            Crear curso
          </Button>
        </div>
      </div>
    </Modal>
  )
}
