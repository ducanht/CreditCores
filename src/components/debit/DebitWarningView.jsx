import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  PhoneCall,
  UserCheck,
  Calendar,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrencyVN, formatDateVN } from '../../utils/dateUtils';
import Pagination from '../Pagination';
import { StatusBadge, EmptyState } from '../shared';

// Helper trích xuất tên Xã / Phường / Thị trấn từ chuỗi địa chỉ CSDL
export function extractCommuneFromAddress(address = '') {
  if (!address) return 'Chưa phân loại';
  const match = address.match(/(Xã|Thị trấn|Phường)\s+([^,]+)/i);
  if (match && match[2]) {
    return `${match[1]} ${match[2].trim()}`;
  }
  // Fallback: nếu chuỗi có dấu phẩy, lấy phần tử áp chót
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 2] || parts[parts.length - 1];
  }
  return address.trim() || 'Chưa phân loại';
}

export default function DebitWarningView({
  warnings = [],
  allCustomers = [],
  loading = false,
  onRefresh,
  onOpenCustomerQuickView
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKy, setFilterKy] = useState('ALL');
  const [filterCommune, setFilterCommune] = useState('ALL');
  const [filterCBTD, setFilterCBTD] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Tạo Map tra cứu thông tin khách hàng từ CSDL (địa chỉ, số điện thoại, cán bộ phụ trách)
  const customerMetaMap = useMemo(() => {
    const map = new Map();
    (allCustomers || []).forEach(c => {
      if (c.maKH) {
        map.set(c.maKH, {
          dienThoai: c.dienThoaiDD || c.dienThoai || '',
          diaChi: c.diaChi || '',
          commune: extractCommuneFromAddress(c.diaChi),
          cbtdPhuTrach: c.ten_CBTD || c.cbtdPhuTrach || 'Chưa gán'
        });
      }
    });
    return map;
  }, [allCustomers]);

  // Kết hợp dữ liệu nợ tồn đọng với thông tin khách hàng từ CSDL
  const enrichedWarnings = useMemo(() => {
    return (warnings || []).map(w => {
      const meta = customerMetaMap.get(w.maKH) || {};
      const dienThoai = w.dienThoai || meta.dienThoai || '';
      const diaChi = w.diaChi || meta.diaChi || '';
      const commune = extractCommuneFromAddress(diaChi);
      const cbtd = w.cbtdPhuTrach || w.ten_CBTD || meta.cbtdPhuTrach || 'Chưa gán';

      return {
        ...w,
        dienThoai,
        diaChi,
        commune,
        cbtd
      };
    });
  }, [warnings, customerMetaMap]);

  // Trích xuất ĐỘNG danh sách các Xã/Thị trấn xuất hiện thực tế trong CSDL
  const availableCommunes = useMemo(() => {
    const set = new Set();
    enrichedWarnings.forEach(w => {
      if (w.commune && w.commune !== 'Chưa phân loại') {
        set.add(w.commune);
      }
    });
    return Array.from(set).sort();
  }, [enrichedWarnings]);

  // Trích xuất ĐỘNG danh sách Cán bộ tín dụng
  const availableCBTDs = useMemo(() => {
    const set = new Set();
    enrichedWarnings.forEach(w => {
      if (w.cbtd && w.cbtd !== 'Chưa gán') {
        set.add(w.cbtd);
      }
    });
    return Array.from(set).sort();
  }, [enrichedWarnings]);

  // Danh sách các kỳ phát sinh có trong dữ liệu
  const uniqueKys = useMemo(() => {
    return Array.from(new Set(enrichedWarnings.map(w => w.kyPhatSinh).filter(Boolean)));
  }, [enrichedWarnings]);

  // Thống kê tổng quan
  const totalOverdue = useMemo(() => {
    return enrichedWarnings.reduce((acc, w) => acc + (Number(w.tongNoTon) || 0), 0);
  }, [enrichedWarnings]);

  // Bộ lọc dữ liệu
  const filteredWarnings = useMemo(() => {
    return enrichedWarnings.filter(w => {
      const matchSearch =
        !searchTerm ||
        w.soHDTD?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.maKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.dienThoai?.includes(searchTerm);

      const matchKy = filterKy === 'ALL' || w.kyPhatSinh === filterKy;
      const matchCommune = filterCommune === 'ALL' || w.commune === filterCommune;
      const matchCBTD = filterCBTD === 'ALL' || w.cbtd === filterCBTD;

      return matchSearch && matchKy && matchCommune && matchCBTD;
    });
  }, [enrichedWarnings, searchTerm, filterKy, filterCommune, filterCBTD]);

  const paginatedWarnings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredWarnings.slice(start, start + pageSize);
  }, [filteredWarnings, page, pageSize]);

  return (
    <div className="d-flex flex-column gap-3 content-fade-in">
      {/* 1. ALERT BANNER TỔNG QUAN NỢ TỒN */}
      <div className="card-modern p-3 bg-danger-subtle border-danger">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2.5">
            <div className="p-2 bg-danger text-white rounded-3 shadow-sm">
              <ShieldAlert size={20} />
            </div>
            <div>
              <span className="small fw-bold text-danger d-block">
                Tổng Nợ Tồn Đọng Cần Đôn Đốc Thu Hồi:
                <strong className="num-tabular fs-5 ms-2">{formatCurrencyVN(totalOverdue)}</strong>
              </span>
              <span className="text-danger-emphasis small" style={{ fontSize: '0.78rem' }}>
                Gồm {warnings.length} món nợ trích thu chưa thành công sau các đợt đối soát CoreBanking
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 shadow-sm bg-white"
                onClick={onRefresh}
                disabled={loading}
                title="Tải lại dữ liệu cảnh báo nợ"
              >
                <RefreshCw size={13} className={loading ? 'fa-spin' : ''} />
                <span>Tải lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. THANH BỘ LỌC ĐỘNG TỪ CSDL & TÌM KIẾM */}
      <div className="card-modern p-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center flex-wrap gap-2">
            {/* Lọc theo Kỳ phát sinh */}
            <select
              className="form-select form-select-sm"
              style={{ width: 140 }}
              value={filterKy}
              onChange={(e) => {
                setFilterKy(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Tất cả Kỳ</option>
              {uniqueKys.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>

            {/* Lọc theo Địa bàn Xã thực tế từ CSDL */}
            <select
              className="form-select form-select-sm"
              style={{ width: 180 }}
              value={filterCommune}
              onChange={(e) => {
                setFilterCommune(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Tất cả Địa bàn CSDL</option>
              {availableCommunes.map(commune => (
                <option key={commune} value={commune}>{commune}</option>
              ))}
            </select>

            {/* Lọc theo CBTD phụ trách */}
            <select
              className="form-select form-select-sm"
              style={{ width: 180 }}
              value={filterCBTD}
              onChange={(e) => {
                setFilterCBTD(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Tất cả Cán bộ tín dụng</option>
              {availableCBTDs.map(cb => (
                <option key={cb} value={cb}>{cb}</option>
              ))}
            </select>
          </div>

          {/* Ô tìm kiếm */}
          <div className="input-group input-group-sm" style={{ width: 260 }}>
            <span className="input-group-text bg-white border-end-0 text-muted">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm Tên, Mã KH, HĐTD, SĐT..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. BẢNG DANH SÁCH NỢ TỒN ĐỌNG */}
      <div className="card-modern p-0 overflow-hidden">
        {loading ? (
          <div className="p-5 text-center text-muted">
            <span className="spinner-border spinner-border-sm me-2 text-danger"></span>
            Đang tải dữ liệu sổ nợ tồn đọng...
          </div>
        ) : paginatedWarnings.length === 0 ? (
          <EmptyState
            title="Không có nợ tồn đọng cần đôn đốc"
            message="Tuyệt vời! Toàn bộ các món trích nợ đã được thu hồi đầy đủ hoặc không khớp với bộ lọc."
          />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="table-light text-muted small text-uppercase font-heading">
                <tr>
                  <th style={{ width: 45 }} className="text-center">#</th>
                  <th>Khách Hàng & Liên Hệ</th>
                  <th>Hợp Đồng Tín Dụng</th>
                  <th>Địa Bàn Thực Tế</th>
                  <th className="text-center">Kỳ Phát Sinh</th>
                  <th className="text-end">Gốc Tồn (VNĐ)</th>
                  <th className="text-end">Lãi Tồn (VNĐ)</th>
                  <th className="text-end">Tổng Nợ Tồn (VNĐ)</th>
                  <th>CBTD Phụ Trách</th>
                  <th className="text-center" style={{ width: 110 }}>Đôn Đốc</th>
                </tr>
              </thead>
              <tbody>
                {paginatedWarnings.map((w, idx) => {
                  const globalIdx = (page - 1) * pageSize + idx;
                  const phoneFormatted = w.dienThoai ? w.dienThoai.replace(/[^0-9]/g, '') : '';

                  return (
                    <tr key={`${w.soHDTD || w.maKH}_${globalIdx}`}>
                      <td className="text-center text-muted small">{globalIdx + 1}</td>

                      {/* Họ tên & Mã KH */}
                      <td>
                        <div
                          className="fw-bold text-slate-800 hover-primary cursor-pointer d-flex align-items-center gap-1"
                          onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView({ maKH: w.maKH, hoTen: w.hoTen })}
                          title="Nhấp xem chi tiết 360°"
                        >
                          <span>{w.hoTen || w.maKH}</span>
                        </div>
                        <div className="text-xs text-muted d-flex align-items-center gap-2 mt-0.5">
                          <span className="badge bg-light text-dark border font-monospace">{w.maKH}</span>
                          {w.dienThoai && <span className="font-monospace">{w.dienThoai}</span>}
                        </div>
                      </td>

                      {/* HĐTD & Số TK */}
                      <td>
                        <div className="fw-bold text-slate-700 font-monospace">{w.soHDTD}</div>
                        <div className="text-xs text-muted font-monospace">TK: {w.soTK || '---'}</div>
                      </td>

                      {/* Địa bàn thực tế từ CSDL */}
                      <td>
                        <div className="d-flex align-items-center gap-1 text-slate-700">
                          <MapPin size={12} className="text-muted flex-shrink-0" />
                          <span className="text-truncate" style={{ maxWidth: 160 }} title={w.diaChi}>
                            {w.commune || 'Chưa phân loại'}
                          </span>
                        </div>
                      </td>

                      {/* Kỳ phát sinh */}
                      <td className="text-center">
                        <span className="badge bg-secondary-subtle text-dark border">
                          {w.kyPhatSinh || '---'}
                        </span>
                      </td>

                      {/* Gốc tồn */}
                      <td className="text-end num-tabular text-muted">
                        {formatCurrencyVN(w.gocTon || w.soTienGocTon || 0)}
                      </td>

                      {/* Lãi tồn */}
                      <td className="text-end num-tabular text-muted">
                        {formatCurrencyVN(w.laiTon || w.soTienLaiTon || 0)}
                      </td>

                      {/* Tổng nợ tồn */}
                      <td className="text-end fw-bold text-danger num-tabular">
                        {formatCurrencyVN(w.tongNoTon || 0)}
                      </td>

                      {/* CBTD Phụ trách */}
                      <td>
                        <span className="small text-slate-700">{w.cbtd}</span>
                      </td>

                      {/* Nút hành động đôn đốc */}
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          {phoneFormatted ? (
                            <a
                              href={`tel:${phoneFormatted}`}
                              className="btn btn-outline-success btn-sm p-1 d-flex align-items-center justify-content-center"
                              title={`Gọi điện ngay: ${phoneFormatted}`}
                              style={{ width: 28, height: 28 }}
                            >
                              <PhoneCall size={13} />
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-light btn-sm p-1 text-muted"
                              disabled
                              title="Không có số điện thoại"
                              style={{ width: 28, height: 28 }}
                            >
                              <PhoneCall size={13} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm p-1 d-flex align-items-center justify-content-center"
                            onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView({ maKH: w.maKH, hoTen: w.hoTen })}
                            title="Xem hồ sơ 360°"
                            style={{ width: 28, height: 28 }}
                          >
                            <UserCheck size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {filteredWarnings.length > pageSize && (
          <div className="p-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span className="small text-muted">
              Hiển thị {paginatedWarnings.length} / {filteredWarnings.length} món nợ tồn
            </span>
            <Pagination
              currentPage={page}
              totalItems={filteredWarnings.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
