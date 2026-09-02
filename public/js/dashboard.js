// Dashboard JavaScript for EventSphere
document.addEventListener('DOMContentLoaded', () => {
  // Confirm action dialogs for delete / status actions
  const confirmForms = document.querySelectorAll('form[data-confirm]');
  confirmForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const message = form.getAttribute('data-confirm') || 'Are you sure you want to perform this action?';
      if (!confirm(message)) {
        e.preventDefault();
      }
    });
  });
});
