<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Kode OTP AEGIS</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:16px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          {{-- Header --}}
          <tr>
            <td style="background:#0F2A44;padding:32px;text-align:center;">
              <p style="margin:0;color:#7EC8F4;font-size:11px;
                        letter-spacing:4px;font-weight:700;">SISTEM KEAMANAN</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;
                         letter-spacing:6px;font-weight:800;">AEGIS</h1>
            </td>
          </tr>

          {{-- Body --}}
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 6px;color:#64748b;font-size:13px;">Halo, <strong style="color:#0F2A44;">{{ $userName }}</strong></p>
              <p style="margin:0 0 28px;color:#334155;font-size:14px;line-height:1.6;">
                Kami menerima permintaan reset password untuk akun AEGIS Anda.
                Gunakan kode OTP berikut untuk melanjutkan:
              </p>

              {{-- OTP Box --}}
              <div style="background:#EAF2FB;border:2px dashed #4A90D9;border-radius:12px;
                          padding:24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#64748b;font-size:11px;letter-spacing:3px;">KODE OTP ANDA</p>
                <p style="margin:0;color:#0F2A44;font-size:42px;font-weight:800;
                          letter-spacing:12px;font-family:monospace;">{{ $otp }}</p>
              </div>

              {{-- Warning --}}
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#FFF7ED;border-left:4px solid #F97316;
                            border-radius:0 8px 8px 0;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;color:#9A3412;font-size:13px;line-height:1.5;">
                      ⏱ Kode ini <strong>berlaku selama 10 menit</strong> dan hanya dapat digunakan satu kali.<br/>
                      Jangan bagikan kode ini kepada siapapun.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                Jika Anda tidak meminta reset password, abaikan email ini.
                Akun Anda tetap aman.
              </p>
            </td>
          </tr>

          {{-- Footer --}}
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;
                       text-align:center;">
              <p style="margin:0;color:#cbd5e1;font-size:11px;letter-spacing:2px;">
                © AEGIS SECURITY SYSTEM — POLINES
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>