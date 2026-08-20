import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CreditCores ErrorBoundary Caught]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    try {
      localStorage.removeItem('CREDITCORES_ACTIVE_TAB');
    } catch (e) {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{ backgroundColor: 'var(--bg-app)' }}>
          <div className="card-modern p-5 text-center shadow-lg" style={{ maxWidth: 540 }}>
            <div
              className="rounded-circle d-inline-flex p-3 mb-4"
              style={{ background: 'rgba(225, 29, 72, 0.15)', color: '#e11d48' }}
            >
              <ShieldAlert size={48} />
            </div>

            <h4 className="fw-bold text-danger mb-2 font-heading">
              Đã Xảy Ra Sự Cố Giao Diện
            </h4>

            <p className="text-muted small mb-4">
              Hệ thống CreditCores đã tự động bảo vệ dữ liệu và cô lập sự cố. Vui lòng bấm nút làm mới bên dưới để tiếp tục làm việc.
            </p>

            <div className="p-3 bg-light rounded-3 text-start small font-monospace text-danger mb-4 text-truncate">
              {this.state.error?.message || 'Lỗi không xác định'}
            </div>

            <button
              className="btn btn-brand fw-bold px-4 py-2 d-inline-flex align-items-center gap-2"
              onClick={this.handleReload}
            >
              <RefreshCw size={18} /> Tải Lại Trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
