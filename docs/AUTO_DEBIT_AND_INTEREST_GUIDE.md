# 💰 QUY CHUẨN TÍNH LÃI NGÀY THỰC TẾ & VẬN HÀNH TRÍCH NỢ TỰ ĐỘNG CASA
# Chuẩn Thông Tư 14/2017/TT-NHNN — CreditCores (QTDND Yên Thọ)

Tài liệu này là hướng dẫn chuẩn mực về công thức tính lãi vay, chu kỳ trích nợ tự động và quy trình đối soát số liệu áp dụng trên toàn bộ hệ thống **CreditCores**.

---

## 📐 1. Nguyên Tắc Tính Lãi Theo Ngày Thực Tế

Hệ thống tính lãi dựa trên nguyên tắc pháp lý của **Thông tư số 14/2017/TT-NHNN** của Ngân hàng Nhà nước Việt Nam:

### 1.1. Nguyên Tắc "Tính Ngày Đầu, Bỏ Ngày Cuối"
- **Thời gian tính lãi**: Tính từ ngày bắt đầu tính lãi $D_{\text{start}}$ (tính cả ngày này) đến ngày kết thúc tính lãi $D_{\text{end}}$ (không tính ngày này).
- **Công thức số ngày thực tế**:
  $$N = D_{\text{end}} - D_{\text{start}} \quad (\text{đơn vị: ngày})$$
  *(Ví dụ: Từ ngày 05/07/2026 đến ngày 05/08/2026 là đúng $31$ ngày thực tế)*.

### 1.2. Mẫu Số Chuẩn Hóa Năm (365 Ngày)
- Một năm được quy định tính tròn là **365 ngày** (không phụ thuộc vào năm nhuận).
- **Công thức tính số tiền lãi**:
  $$\text{Số tiền lãi (VNĐ)} = \frac{\text{Dư nợ thực tế (VNĐ)} \times \text{Lãi suất năm (\%)} \times N}{36500}$$

---

## 🗓️ 2. Quy Định 3 Kỳ Trích Nợ Định Kỳ Trong Tháng

Mỗi tháng khách hàng được đăng ký một trong 3 kỳ thu nợ cố định:

| Kỳ Trích Nợ | Ngày Thu Nợ Cố Định | Khoảng Thời Gian Tính Lãi Chu Chuẩn | Số Ngày Điển Hình |
| :---: | :---: | :---: | :---: |
| **Kỳ 1** | **Ngày 05 hàng tháng** | Từ ngày 05 tháng $T-1$ đến ngày 05 tháng $T$ | $28 - 31$ ngày |
| **Kỳ 2** | **Ngày 15 hàng tháng** | Từ ngày 15 tháng $T-1$ đến ngày 15 tháng $T$ | $28 - 31$ ngày |
| **Kỳ 3** | **Ngày 25 hàng tháng** | Từ ngày 25 tháng $T-1$ đến ngày 25 tháng $T$ | $28 - 31$ ngày |

> [!NOTE]
> Nếu khách hàng mới vay trong tháng (hoặc đã trả bớt lãi ở một ngày lẻ trong tháng), ngày bắt đầu $D_{\text{start}}$ sẽ tự động lấy theo trường `TraLaiDenNgay` trên Hợp đồng tín dụng (`HDTD_CORE`).

---

## 🧮 3. Ví Dụ Tính Toán Thực Tế

### Ví Dụ: Khách Hàng Nguyễn Văn An (KH008892)
- **Dư nợ gốc**: $150.000.000$ VNĐ.
- **Lãi suất**: $10.5\%$/năm.
- **Kỳ trích nợ**: Kỳ 1 (Ngày 05 hàng tháng).
- **Kỳ thu**: Tháng 08/2026 (Khoảng tính lãi từ `05/07/2026` đến `05/08/2026`).
- **Nợ tồn kỳ trước**: $0$ VNĐ.

**Bước 1: Tính số ngày thực tế**
$$N = 31 \text{ ngày}$$

**Bước 2: Tính số tiền lãi phát sinh**
$$\text{Lãi} = \frac{150.000.000 \times 10.5 \times 31}{36500} = 1.337.671 \text{ VNĐ}$$

**Bước 3: Tổng số tiền đề xuất trích nợ**
$$\text{Tổng phải thu} = \text{Lãi} + \text{Gốc đến hạn} + \text{Nợ tồn} = 1.337.671 + 0 + 0 = 1.337.671 \text{ VNĐ}$$

---

## 🔍 4. Cấu Trúc Mã Nguồn Thực Thi Thuật Toán

- **Frontend Logic**: [`CreditCores/src/utils/interestUtils.js`](file:///d:/Antigravity%20Projects/CreditCores/src/utils/interestUtils.js)
  - `calculateActualDays(startDateStr, endDateStr)`
  - `getDebitCyclePeriod(monthStr, cycle)`
  - `calculateContractActualInterest(contract, cycleEndDateStr)`
  - `calculateCustomerBatchInterest(customer, monthStr, cycle, debtMap)`
- **Google Apps Script Backend**: [`CreditCores/gas_backend/Utils/DateUtils.gs`](file:///d:/Antigravity%20Projects/CreditCores/gas_backend/Utils/DateUtils.gs)
- **Unit Test Suite**: [`CreditCores/src/utils/interestUtils.test.mjs`](file:///d:/Antigravity%20Projects/CreditCores/src/utils/interestUtils.test.mjs) (PASS 100%).
