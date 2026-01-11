'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'

export default function NewTicketPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    department: 'Support IT',
    category: '',
    customCategory: '',
    priority: 'low',
    message: ''
  })

  const [attachment, setAttachment] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file size (max 30MB)
      if (file.size > 30 * 1024 * 1024) {
        setError('Ukuran file maksimal 30MB')
        return
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/zip',
        'application/x-gzip',
        'application/gzip',
        'text/plain',
        'application/pdf'
      ]

      if (!allowedTypes.includes(file.type)) {
        setError('Format file tidak didukung. Gunakan: JPG, PNG, GIF, ZIP, GZ, TXT, PDF')
        return
      }

      setAttachment(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!formData.title.trim()) {
        setError('Judul harus diisi')
        setLoading(false)
        return
      }

      if (!formData.message.trim()) {
        setError('Pesan harus diisi')
        setLoading(false)
        return
      }

      // Prepare form data
      const submitData = new FormData()
      submitData.append('title', formData.title.trim())
      submitData.append('department', formData.department)

      // Category handling
      if (formData.category === 'Lainnya' && formData.customCategory.trim()) {
        submitData.append('category', formData.customCategory.trim())
      } else {
        submitData.append('category', formData.category || 'Umum')
      }

      submitData.append('priority', formData.priority)
      submitData.append('message', formData.message.trim())

      if (attachment) {
        submitData.append('attachment', attachment)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/helpdesk`, {
        method: 'POST',
        credentials: 'include',
        body: submitData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        router.push(`/apps/helpdesk/${result.data.ticket_number}`)
      } else {
        setError(result.message || 'Gagal membuat tiket')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat membuat tiket')
      console.error('Error creating ticket:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container mx-auto p-6 max-w-4xl'>
      <Button variant='ghost' className='mb-4' onClick={() => router.back()}>
        <i className='tabler-arrow-left mr-2' />
        Kembali
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Buat Tiket Support Baru</CardTitle>
          <CardDescription>
            Isi formulir di bawah untuk membuat tiket support. Tim kami akan segera membantu Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Nama - Auto filled */}
            <div className='space-y-2'>
              <Label htmlFor='name'>Nama</Label>
              <Input id='name' value={user?.name || ''} disabled />
            </div>

            {/* Email - Auto filled */}
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' type='email' value={user?.email || ''} disabled />
            </div>

            {/* Subject/Title */}
            <div className='space-y-2'>
              <Label htmlFor='title'>
                Judul <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='title'
                placeholder='Jelaskan masalah Anda secara singkat'
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={255}
                required
              />
            </div>

            {/* Department */}
            <div className='space-y-2'>
              <Label htmlFor='department'>
                Department <span className='text-red-500'>*</span>
              </Label>
              <Select value={formData.department} onValueChange={(val) => setFormData({ ...formData, department: val })}>
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Department' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Support IT'>Support IT</SelectItem>
                  <SelectItem value='Sales/Billing'>Sales/Billing</SelectItem>
                  <SelectItem value='Abuse'>Abuse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className='space-y-2'>
              <Label htmlFor='category'>
                Kategori <span className='text-red-500'>*</span>
              </Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Kategori' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Bugs/Error'>Bugs/Error</SelectItem>
                  <SelectItem value='Pembayaran'>Pembayaran</SelectItem>
                  <SelectItem value='Kecurangan'>Kecurangan</SelectItem>
                  <SelectItem value='Lainnya'>Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Category - Show if "Lainnya" is selected */}
            {formData.category === 'Lainnya' && (
              <div className='space-y-2'>
                <Label htmlFor='customCategory'>
                  Kategori Lainnya <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='customCategory'
                  placeholder='Masukkan kategori'
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                  maxLength={100}
                  required
                />
              </div>
            )}

            {/* Priority */}
            <div className='space-y-2'>
              <Label htmlFor='priority'>
                Priority <span className='text-red-500'>*</span>
              </Label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className='space-y-2'>
              <Label htmlFor='message'>
                Pesan <span className='text-red-500'>*</span>
              </Label>
              <Textarea
                id='message'
                placeholder='Jelaskan masalah Anda secara detail'
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={8}
                maxLength={10000}
                required
                className='resize-none'
              />
              <p className='text-sm text-muted-foreground'>{formData.message.length} / 10000 karakter</p>
            </div>

            {/* Attachment */}
            <div className='space-y-2'>
              <Label htmlFor='attachment'>Lampiran (Opsional)</Label>
              <Input
                id='attachment'
                type='file'
                onChange={handleFileChange}
                accept='.jpg,.jpeg,.gif,.png,.zip,.gz,.txt,.pdf'
              />
              <p className='text-sm text-muted-foreground'>
                Allowed File Extensions: .jpg, .jpeg, .gif, .png, .zip, .gz, .txt, .pdf (Max 30MB)
              </p>
              {attachment && (
                <div className='flex items-center gap-2 text-sm'>
                  <i className='tabler-file' />
                  <span>{attachment.name}</span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setAttachment(null)}
                  >
                    <i className='tabler-x' />
                  </Button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className='flex gap-4'>
              <Button type='submit' disabled={loading} className='flex-1'>
                {loading ? 'Mengirim...' : 'Submit'}
              </Button>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
