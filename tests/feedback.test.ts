import { expect,test } from 'vitest';
import { validateFeedback,type FeedbackResponse } from '../src/shared/feedback-schema';
const form:FeedbackResponse={tester_code:'T01',q1_self_complete:'co',q2_clarity:4,q3_excess_missing:'Không có ý kiến.',q4_would_use:'Cần bộ quy tắc của đơn vị.',q5_top_fix:'Chữ trên phiếu.',app_version:'0.1.0',rulepack_id:'demo-1.0.0'};
test('phản hồi đúng giới hạn',()=>expect(validateFeedback(form)).toBe(true));
test('từ chối điểm, mã và chuỗi ngoài giới hạn',()=>{expect(validateFeedback({...form,q2_clarity:9})).toBe(false);expect(validateFeedback({...form,tester_code:'người thật'})).toBe(false);expect(validateFeedback({...form,q3_excess_missing:'x'.repeat(501)})).toBe(false);});
