import Link from 'next/link'

export default function Forbidden() {
  return (
    <div>
      <h2>Không được phép</h2>
      <p>Bạn không có quyền truy cập vào tài nguyên này.</p>
      <Link href="/">Quay về trang chủ</Link>
    </div>
  )
}
