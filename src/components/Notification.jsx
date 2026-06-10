export default function Notification({ message }) {
  return (
    <div id="notif" className={message ? 'visible' : ''}>
      {message || '// function not implemented'}
    </div>
  );
}
