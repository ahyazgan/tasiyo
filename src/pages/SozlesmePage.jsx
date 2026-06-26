import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Printer } from "lucide-react";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import SEO from "../components/SEO";
import Logo from "../components/Logo";
import { buildEIrsaliye, buildEFatura, KDV_RATE } from "../utils/eDocs";
import { sendToGib, isEInvoiceConfigured } from "../lib/eInvoiceProvider";
import { fmtTL } from "../utils/payments";

// ── "SAHA" dijital taşıma sözleşmesi / sevk irsaliyesi (yazdırılabilir).
//    2px ink çerçeve, hazard şeridi, koyu tutar bloğu, Archivo uppercase + Space Mono.
//    Tüm işlevsellik korundu: sözleşme türetme (offer/listing/getContact),
//    e-İrsaliye + e-Fatura GİB gönderimi (mock), yazdır/PDF, navigate, SEO.

const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  green: "#16803C",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  line: "#F0ECE3",
  sub: "#5A5852",
  muted: "#9A968D",
  red: "#DC2626",
};
const MONO = "'Space Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace";
const ARCH = "'Archivo', system-ui, sans-serif";
const HAZARD = `repeating-linear-gradient(45deg, ${C.ink} 0 9px, ${C.yellow} 9px 18px)`;

const belgeNo = (id) => "HMT-SZL-" + String(id).padStart(6, "0");
const ilanNo = (id) => "HMT-" + String(id).padStart(4, "0");
const today = () => {
  try {
    return new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "";
  }
};

// ── Çerçeveli taraf kutusu (İş Veren / Taşıyan) ──
function PartyBox({ label, name, lines = [] }) {
  return (
    <div style={{ border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 13px", background: C.card }}>
      <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", color: C.sub, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: ARCH, fontSize: 15, fontWeight: 800, color: C.ink, marginTop: 4, lineHeight: 1.15 }}>
        {name || "—"}
      </div>
      {lines.filter(Boolean).map((t, i) => (
        <div key={i} style={{ fontFamily: MONO, fontSize: 11, color: C.sub, marginTop: 3 }}>{t}</div>
      ))}
    </div>
  );
}

// ── İş detayı tablo satırı ──
function DetailRow({ label, value, last }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "9px 13px",
        borderBottom: last ? "none" : `1.5px solid ${C.line}`,
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", color: C.muted, textTransform: "uppercase", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: C.ink, textAlign: "right" }}>
        {value || "—"}
      </span>
    </div>
  );
}

export default function SozlesmePage({ listings = LISTINGS, offers = [], getContact }) {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const offer = offers.find((o) => String(o.id) === String(offerId));
  const l = offer ? listings.find((x) => String(x.id) === String(offer.listingId)) : null;

  // e-Belge gönderim durumu (mock: GİB onaylı simülasyonu)
  const [gib, setGib] = useState({}); // { irsaliye?: 'ONAYLI', fatura?: 'ONAYLI' }
  const [gibBusy, setGibBusy] = useState("");

  if (!offer || !l) {
    return (
      <div style={{ width: "100%", maxWidth: 460, margin: "0 auto", minHeight: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
        <SEO title="Sözleşme bulunamadı" description="Dijital taşıma sözleşmesi." />
        <div style={{ height: 8, backgroundImage: HAZARD }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "64px 24px", textAlign: "center", color: C.ink }}>
          <div style={{ fontFamily: ARCH, fontSize: 22, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.02em" }}>
            Sözleşme bulunamadı
          </div>
          <button
            onClick={() => navigate("/ilanlarim")}
            style={{ background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 22px", fontFamily: ARCH, fontWeight: 800, fontSize: 13, textTransform: "uppercase", cursor: "pointer" }}
          >
            İlanlarım
          </button>
        </div>
      </div>
    );
  }

  const cat = CATS.find((c) => c.id === l.cat);
  const owner = { name: l.owner, phone: getContact?.(l.ownerId)?.phone };
  const nak = { name: offer.fromUser, phone: getContact?.(offer.fromUserId)?.phone };
  const bedel = offer.price ? `₺${offer.price.toLocaleString("tr-TR")}` : "Teklif usulü (taraflar arası mutabık)";

  // ── e-Belgeler ──
  const irs = buildEIrsaliye(l, offer);
  const fat = buildEFatura(l, offer);
  const hasAmount = (l.paymentAmount || offer.price || 0) > 0;
  const sendDoc = async (which, doc) => {
    setGibBusy(which);
    try {
      const res = await sendToGib(doc);
      if (res.ok) setGib((g) => ({ ...g, [which]: "ONAYLI" }));
    } catch (e) {
      setGib((g) => ({ ...g, [which]: "HATA: " + (e?.message || "gönderilemedi") }));
    }
    setGibBusy("");
  };

  const gibOnayli = gib.irsaliye === "ONAYLI";

  // güzergah & süre türetme
  const guzergah = `${l.il}${l.ilce ? " / " + l.ilce : ""}${l.bosaltma ? "  →  " + l.bosaltma : ""}`;
  const miktar = l.amount ? `${l.amount} ${l.unit || ""}`.trim() : "—";

  return (
    <div style={{ width: "100%", maxWidth: 460, margin: "0 auto", minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      <SEO title={`Sözleşme ${belgeNo(offer.id)}`} description="Dijital taşıma sözleşmesi / sevk irsaliyesi." />

      {/* ── Header (yazdırmada gizli) ── */}
      <header
        className="print:hidden"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: C.header, borderBottom: `2px solid ${C.ink}`, padding: "12px 14px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Geri"
            style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, cursor: "pointer", color: C.ink }}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div style={{ fontFamily: ARCH, fontSize: 15, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.02em", color: C.ink }}>
            Sözleşme
          </div>
        </div>
        <button
          onClick={() => window.print()}
          style={{ display: "flex", alignItems: "center", gap: 7, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "9px 14px", fontFamily: ARCH, fontWeight: 800, fontSize: 12, textTransform: "uppercase", cursor: "pointer" }}
        >
          <Printer size={15} strokeWidth={2.5} /> Yazdır / PDF
        </button>
      </header>

      <div style={{ padding: "16px 14px 32px" }}>
        {/* ── SÖZLEŞME BELGESİ KARTI ── */}
        <div
          className="print:!border-2 print:!shadow-none"
          style={{ border: `2px solid ${C.ink}`, borderRadius: 6, background: C.card, overflow: "hidden", boxShadow: "6px 6px 0 rgba(10,10,10,.12)" }}
        >
          {/* Hazard şeridi */}
          <div style={{ height: 7, backgroundImage: HAZARD }} />

          <div style={{ padding: "18px 16px" }}>
            {/* Başlık satırı */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, borderBottom: `2px solid ${C.ink}`, paddingBottom: 14 }}>
              <div>
                <div style={{ fontFamily: ARCH, fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.02em", color: C.ink, lineHeight: 1.05 }}>
                  Taşıma<br />Sözleşmesi
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.sub, marginTop: 6 }}>
                  e-İrsaliye uyumlu · GİB onaylı
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <Logo size="sm" />
                <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.ink }}>{belgeNo(offer.id)}</div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.muted }}>{today()}</div>
              </div>
            </div>

            {/* İş Veren / Taşıyan 2x grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingTop: 16 }}>
              <PartyBox
                label="İş Veren"
                name={owner.name}
                lines={[`VKN: ${ilanNo(l.id)}`, owner.phone && `Tel: ${owner.phone}`]}
              />
              <PartyBox
                label="Taşıyan"
                name={nak.name}
                lines={[l.vehicle && `Araç: ${l.vehicle}`, nak.phone && `Tel: ${nak.phone}`]}
              />
            </div>

            {/* İŞ DETAYI (sarı bar başlık + çerçeve tablo) */}
            <div style={{ marginTop: 16 }}>
              <div style={{ background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: "6px 6px 0 0", padding: "7px 13px", fontFamily: ARCH, fontSize: 12.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".02em", color: C.ink }}>
                İş Detayı
              </div>
              <div style={{ border: `2px solid ${C.ink}`, borderTop: "none", borderRadius: "0 0 6px 6px" }}>
                <DetailRow label="Malzeme" value={l.material || cat?.name} />
                <DetailRow label="Güzergah" value={guzergah} />
                <DetailRow label="Miktar" value={miktar} />
                <DetailRow label="Süre / Tarih" value={l.dateText || l.recurringText} last />
              </div>
            </div>

            {/* Anlaşılan tutar (koyu blok) */}
            <div
              style={{ marginTop: 16, background: C.ink, borderRadius: 6, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 22, backgroundImage: HAZARD }} />
              <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", color: "#fff", textTransform: "uppercase" }}>
                Anlaşılan<br />Tutar
              </div>
              <div style={{ fontFamily: MONO, fontSize: offer.price ? 22 : 13, fontWeight: 700, color: C.yellow, marginRight: 26, textAlign: "right" }}>
                {bedel}
              </div>
            </div>

            {/* Yasal metin */}
            <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 9, lineHeight: 1.7, color: C.muted }}>
              1. Taşıma; yukarıda belirtilen güzergah, malzeme ve miktar için yapılır.
              2. Araç yetki belgeleri (K belgesi vb.) ve sigorta yükümlülükleri taşıyana aittir.
              3. Yükleme/boşaltma koşulları ve teslim süresi taraflarca teyit edilir.
              4. Ödeme taraflar arasında belirlenen şekilde yapılır; YÜKLET yalnızca eşleştirme
              platformudur, taşıma sözleşmesinin tarafı değildir.
              5. Hafriyat taşımalarında döküm sahası ve ilgili belediye/çevre mevzuatına uyum
              taraflarca sağlanır.
            </div>

            {/* İmza 2x grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 28, paddingTop: 4 }}>
              {[["İş Veren", owner.name], ["Taşıyan", nak.name]].map(([role, who]) => (
                <div key={role} style={{ textAlign: "center" }}>
                  <div style={{ borderTop: `1.5px solid ${C.ink}`, paddingTop: 6 }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.ink, textTransform: "uppercase" }}>İmza</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: C.muted, marginTop: 2 }}>{role} · {who}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alt onay şeridi */}
          <div style={{ borderTop: `2px solid ${C.ink}`, padding: "10px 16px", background: C.stone, textAlign: "center" }}>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: gibOnayli ? C.green : C.muted }}>
              {gibOnayli ? "✓ e-İrsaliye GİB'e iletildi · ONAYLI" : "e-İrsaliye taslak — aşağıdan GİB'e gönderin"}
            </span>
          </div>
        </div>

        {/* ── RESMÎ e-BELGELER (e-İrsaliye + e-Fatura) ── */}
        <div className="print:hidden" style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontFamily: ARCH, fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.02em", color: C.ink }}>
              Resmî e-Belgeler
            </h2>
            {!isEInvoiceConfigured && (
              <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.sub, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "1px 7px" }}>
                DEMO
              </span>
            )}
          </div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.sub, marginTop: 8, lineHeight: 1.55 }}>
            YÜKLET, yük yola çıkınca <b>e-İrsaliye</b>, iş bitince <b>e-Fatura</b> belgesini otomatik
            üretir ve (entegratör bağlanınca) GİB'e gönderir.
          </p>

          {/* e-İrsaliye */}
          <EDocCard
            doc={irs}
            status={gib.irsaliye}
            busy={gibBusy === "irsaliye"}
            onSend={() => sendDoc("irsaliye", irs)}
            rows={[
              ["Senaryo", irs.senaryo + " / " + irs.tip],
              ["ETTN", irs.ettn],
              ["Gönderen (yük)", irs.gonderen],
              ["Taşıyan", irs.tasiyan],
              ["Malzeme / GTİP", `${irs.malzeme}${irs.gtip ? " · " + irs.gtip : ""}`],
              ["Miktar", irs.miktar],
              ["Çıkış", irs.cikis],
              ["Varış", irs.varis],
              ["Araç", irs.arac],
            ]}
          />

          {/* e-Fatura */}
          {hasAmount && (
            <EDocCard
              doc={fat}
              status={gib.fatura}
              busy={gibBusy === "fatura"}
              onSend={() => sendDoc("fatura", fat)}
              rows={[
                ["Senaryo", fat.senaryo + " / " + fat.tip],
                ["ETTN", fat.ettn],
                ["Hizmeti veren", fat.saglayan],
                ["Hizmeti alan", fat.alan],
                ["Açıklama", fat.aciklama],
              ]}
              totals={[
                ["Matrah (hizmet bedeli)", fmtTL(fat.matrah)],
                [`KDV (%${Math.round(KDV_RATE * 100)})`, fmtTL(fat.kdv)],
                ["Genel toplam", fmtTL(fat.toplam), true],
                ["Platform komisyonu", "−" + fmtTL(fat.komisyon)],
                ["Nakliyeci net hakediş", fmtTL(fat.netNakliyeci)],
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tek e-belge kartı (SAHA) ──
function EDocCard({ doc, status, busy, onSend, rows = [], totals = [] }) {
  const onayli = status === "ONAYLI";
  const hata = typeof status === "string" && status.startsWith("HATA");
  const badge = onayli
    ? { bg: C.green, fg: "#fff", txt: "✓ GİB ONAYLI" }
    : hata
    ? { bg: C.red, fg: "#fff", txt: "HATA" }
    : { bg: C.stone, fg: C.ink, txt: "TASLAK" };

  return (
    <div style={{ border: `2px solid ${C.ink}`, borderRadius: 6, background: C.card, marginTop: 14, overflow: "hidden", boxShadow: "3px 3px 0 rgba(10,10,10,.12)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "13px 14px", borderBottom: `2px solid ${C.ink}` }}>
        <div>
          <div style={{ fontFamily: ARCH, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.01em", color: C.ink }}>{doc.title}</div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.sub, marginTop: 2 }}>{doc.no}</div>
        </div>
        <span style={{ background: badge.bg, color: badge.fg, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "2px 8px", fontFamily: MONO, fontSize: 9.5, fontWeight: 700, whiteSpace: "nowrap" }}>
          {badge.txt}
        </span>
      </div>

      <div style={{ padding: "4px 14px" }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: `1.5px solid ${C.line}` }}>
            <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", flexShrink: 0 }}>{k}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink, textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </div>

      {totals.length > 0 && (
        <div style={{ margin: "10px 14px", border: `2px solid ${C.ink}`, borderRadius: 6, background: C.stone, padding: "10px 12px" }}>
          {totals.map(([k, v, strong]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                fontFamily: MONO,
                fontSize: 11,
                padding: strong ? "6px 0 2px" : "3px 0",
                marginTop: strong ? 4 : 0,
                borderTop: strong ? `1.5px solid ${C.ink}` : "none",
                fontWeight: strong ? 700 : 400,
                color: strong ? C.ink : C.sub,
              }}
            >
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: "0 14px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {!onayli && (
          <button
            onClick={onSend}
            disabled={busy}
            style={{ background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 18px", fontFamily: ARCH, fontWeight: 800, fontSize: 12, textTransform: "uppercase", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "Gönderiliyor…" : "GİB'e Gönder"}
          </button>
        )}
        {onayli && (
          <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.green }}>
            Belge GİB'e iletildi. ETTN: {doc.ettn}
          </span>
        )}
        {hata && (
          <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.red }}>
            {status.replace("HATA: ", "")}
          </span>
        )}
      </div>
    </div>
  );
}
