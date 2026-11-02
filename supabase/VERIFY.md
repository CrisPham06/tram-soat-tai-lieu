# Tự kiểm sau khi áp SQL

Chạy trong PowerShell trên máy của người điều phối. Đọc cấu hình công khai từ biến môi trường, không in giá trị.

```powershell
$feedbackHeaders = @{ apikey = $env:VITE_SUPABASE_ANON_KEY; Authorization = ('Bearer ' + $env:VITE_SUPABASE_ANON_KEY); Prefer = 'return=minimal' }
$feedbackEndpoint = $env:VITE_SUPABASE_URL + '/rest/v1/feedback_responses'
$feedbackPayload = @{ tester_code='T99'; q1_self_complete='co'; q2_clarity=4; q3_excess_missing='Phản hồi giả lập'; q4_would_use='Thử kết nối'; q5_top_fix='Thử ràng buộc'; app_version='1.0.0'; rulepack_id='demo-1.0.0' }
Invoke-RestMethod -Method Post -Uri $feedbackEndpoint -Headers $feedbackHeaders -ContentType 'application/json' -Body ($feedbackPayload | ConvertTo-Json)
$feedbackPayload.q2_clarity = 9
Invoke-RestMethod -Method Post -Uri $feedbackEndpoint -Headers $feedbackHeaders -ContentType 'application/json' -Body ($feedbackPayload | ConvertTo-Json)
Invoke-RestMethod -Method Get -Uri $feedbackEndpoint -Headers $feedbackHeaders
$feedbackPayload.q2_clarity = 4
$feedbackPayload.id = [guid]::NewGuid().ToString()
Invoke-RestMethod -Method Post -Uri $feedbackEndpoint -Headers $feedbackHeaders -ContentType 'application/json' -Body ($feedbackPayload | ConvertTo-Json)
```

Kỳ vọng lần lượt: chèn đúng cấu trúc thành công; điểm ngoài thang bị từ chối; đọc bị từ chối hoặc rỗng; chèn cột do cơ sở dữ liệu tự đặt bị từ chối. Thử thêm chuỗi góp ý vượt giới hạn và tự đặt `created_at` phải bị từ chối. Chỉ dùng mã kỹ thuật, không đưa vào tổng hợp thử người dùng. Kết quả kiểm host và quyền thật của đợt phát hành ở reports/security-live.json. Người vận hành xóa các hàng kỹ thuật sau lượt kiểm.
