CHAIXI BAMEEKIAO — OPERATIONS WORKFLOW V1.0
=============================================

เพิ่ม Operations Control Center เพื่อเรียงลำดับงานจริง:
- Daily Operations: ก่อนเปิดร้าน -> ระหว่างวัน -> ก่อนปิดวัน -> EOD
- Month-End Closing
- Year-End Closing
- Complete = แถบเขียว
- ขั้นถัดไป Locked จนกว่าขั้นก่อนหน้าจะ Complete
- Open Shift / Close Shift / EOD ใช้สัญญาณจากระบบจริงเมื่อสามารถตรวจได้
- ขั้นที่เป็นการตรวจสอบโดยคนให้ Manager/Admin กด “ยืนยันเสร็จแล้ว” และบันทึกลง Supabase
- สถานะ Manual sync ข้ามเครื่อง/ข้ามผู้ใช้ ไม่ใช้ localStorage

ไฟล์ที่ต้องอัป Back Office:
- operations.html
- css/operations.css
- js/operations.js
- js/backoffice-sidebar.js
- dashboard.html

SQL ที่ต้องรันก่อน:
- sql/PATCH_OPERATIONS_WORKFLOW_V1.sql.txt

ลำดับติดตั้ง:
1) Run SQL ทั้งไฟล์ใน Supabase SQL Editor
2) ควรเห็นชื่อ function 3 รายการในผล VERIFY
3) อัปไฟล์เว็บ changed-only แทนไฟล์เดิมตาม path
4) Hard Refresh
5) เข้า Back Office > ภาพรวม > งานวันนี้

ข้อควรทราบ:
- Patch นี้ไม่ DELETE/UPDATE Sales, Stock, PO, Production เดิม
- Workflow เป็นตัวควบคุม/ติดตามงาน ไม่เปลี่ยน Business Logic หลัก
- ขั้น Manual สามารถ Undo ได้โดย Manager/Admin
