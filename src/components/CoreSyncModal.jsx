import React from 'react';
import ExtractAsOfModal from './dashboard/ExtractAsOfModal';

/**
 * Trung Tâm Đồng Bộ Dữ Liệu CoreBanking Toàn Diện (CoreSyncModal)
 * Quản lý đồng bộ 100% qua giao diện WebApp (Số liệu hiện tại, Sao kê đến ngày, Sao kê cuối tháng)
 */
export default function CoreSyncModal(props) {
  return <ExtractAsOfModal {...props} />;
}
