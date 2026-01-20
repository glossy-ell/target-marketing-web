export interface User {
  seq: number;            // 순번 (자동 증가)
  id: number;             // 사용자 ID (고유 값)
  name: string;           // 사용자 이름
  password: string;       // 암호화된 비밀번호
  role: number;           // 역할 (정수형)
  agency?: string;        // 기관 (nullable)
  distributor?: string;   // 유통사 (nullable)
  is_deleted: number;     // 삭제 여부 (0: 미삭제, 1: 삭제됨)
  created_at: Date;       // 생성일
}
