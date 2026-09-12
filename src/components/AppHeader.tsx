
interface AppHeaderProps {
  sectionTitle?: string;
  avatarUrl?: string;
  hasNotification?: boolean;
}

export default function AppHeader({
  sectionTitle = 'Hoy',
  hasNotification = true
}: AppHeaderProps) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      backgroundColor: 'rgba(246, 251, 244, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 4px 20px -4px rgba(24, 29, 25, 0.05)',
      borderBottom: '1px solid rgba(46, 111, 64, 0.08)',
      paddingTop: 'env(safe-area-inset-top, 0px)'
    }}>
      <div style={{
        height: '64px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '430px',
        margin: '0 auto'
      }}>
        {/* Logo & Section Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#11562a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaefb4',
            fontFamily: 'var(--font-serif)',
            fontSize: '18px',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(17, 86, 42, 0.25)'
          }}>
            K
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '19px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#11562a',
              lineHeight: 1
            }}>
              Korat Life
            </span>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              fontWeight: 700,
              color: '#404940',
              opacity: 0.8,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              lineHeight: 1,
              marginTop: '3px'
            }}>
              {sectionTitle}
            </span>
          </div>
        </div>

        {/* User Profile Avatar with indicator */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: '#11562a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(17,86,42,0.25)',
            color: '#ffffff'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          {hasNotification && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#9a442d',
              border: '2px solid #f6fbf4'
            }} />
          )}
        </div>
      </div>
    </header>
  );
}
