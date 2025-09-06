export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });
});

// Chrome 116+
// klik icon extension -> buka side panel
chrome?.sidePanel
  ?.setPanelBehavior?.({ openPanelOnActionClick: true })
  .catch(() => {});
