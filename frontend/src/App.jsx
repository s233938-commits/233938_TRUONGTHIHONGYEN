
import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'https://repulsive-wand-4jp9gvqp6j7w274x7-5000.app.github.dev/api/books'

function App() {
  const [books, setBooks] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    bookId: '',
    title: '',
    author: '',
    category: '',
    year: new Date().getFullYear(),
  })

  async function loadBooks(keyword = search) {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `${API_URL}?search=${encodeURIComponent(keyword)}`,
      )
      if (!response.ok) throw new Error('Không tải được danh sách sách')
      const data = await response.json()
      setBooks(data)
    } catch {
      setError('Không kết nối được API. Hãy kiểm tra backend và cổng 5000.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooks('')
  }, [])

  function resetForm() {
    setForm({
      bookId: '',
      title: '',
      author: '',
      category: '',
      year: new Date().getFullYear(),
    })
    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            year: Number(form.year),
          }),
        },
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Không thể lưu sách')

      setMessage(editingId ? 'Cập nhật sách thành công!' : 'Thêm sách thành công!')
      resetForm()
      await loadBooks('')
      setSearch('')
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi lưu sách')
    }
  }

  function startEdit(book) {
    setEditingId(book._id)
    setForm({
      bookId: book.bookId,
      title: book.title,
      author: book.author,
      category: book.category,
      year: book.year,
    })
    setMessage('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteBook(book) {
    if (!window.confirm(`Bạn có chắc muốn xóa sách "${book.title}" không?`)) return
    setError('')
    setMessage('')
    try {
      const response = await fetch(`${API_URL}/${book._id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Không thể xóa sách')
      setMessage('Xóa sách thành công!')
      await loadBooks()
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi xóa sách')
    }
  }

  async function handleSearch(event) {
    event.preventDefault()
    await loadBooks(search)
  }

  return (
    <main className="app">
      <header className="hero">
        <div className="hero-icon">📚</div>
        <div>
          <p className="eyebrow">BOOK MANAGEMENT SYSTEM</p>
          <h1>Quản lý thư viện sách</h1>
          <p className="subtitle">Quản lý thông tin sách đơn giản và hiệu quả</p>
        </div>
      </header>

      <section className="panel">
        <h2>{editingId ? 'Cập nhật sách' : 'Thêm sách mới'}</h2>
        <form className="book-form" onSubmit={handleSubmit}>
          <label>
            Mã sách
            <input
              required
              value={form.bookId}
              onChange={(e) => setForm({ ...form, bookId: e.target.value })}
              placeholder="Ví dụ: B004"
            />
          </label>
          <label>
            Tên sách
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Nhập tên sách"
            />
          </label>
          <label>
            Tác giả
            <input
              required
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Nhập tên tác giả"
            />
          </label>
          <label>
            Thể loại
            <input
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Ví dụ: Công nghệ thông tin"
            />
          </label>
          <label>
            Năm xuất bản
            <input
              required
              type="number"
              min="0"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </label>
          <div className="form-actions">
            <button className="primary" type="submit">
              {editingId ? 'Lưu cập nhật' : '＋ Thêm sách'}
            </button>
            {editingId && (
              <button className="secondary" type="button" onClick={resetForm}>
                Hủy
              </button>
            )}
          </div>
        </form>
        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}
      </section>

      <section className="panel">
        <div className="list-heading">
          <div>
            <h2>Danh sách sách</h2>
            <p className="muted">Tổng số: {books.length} cuốn</p>
          </div>
          <button className="secondary" onClick={() => loadBooks('')}>
            Làm mới
          </button>
        </div>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã sách, tên, tác giả, thể loại..."
          />
          <button className="primary" type="submit">Tìm kiếm</button>
          <button
            className="secondary"
            type="button"
            onClick={() => {
              setSearch('')
              loadBooks('')
            }}
          >
            Xóa lọc
          </button>
        </form>

        {loading ? (
          <p className="empty">Đang tải dữ liệu...</p>
        ) : books.length === 0 ? (
          <p className="empty">Chưa có sách phù hợp.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã sách</th>
                  <th>Tên sách</th>
                  <th>Tác giả</th>
                  <th>Thể loại</th>
                  <th>Năm</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id}>
                    <td><span className="book-code">{book.bookId}</span></td>
                    <td className="book-title">{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.category}</td>
                    <td>{book.year}</td>
                    <td>
                      <div className="row-actions">
                        <button className="edit-btn" onClick={() => startEdit(book)}>
                          Sửa
                        </button>
                        <button className="delete-btn" onClick={() => deleteBook(book)}>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <footer>Hệ thống quản lý sách · React · Express · MongoDB Atlas</footer>
    </main>
  )
}

export default App
