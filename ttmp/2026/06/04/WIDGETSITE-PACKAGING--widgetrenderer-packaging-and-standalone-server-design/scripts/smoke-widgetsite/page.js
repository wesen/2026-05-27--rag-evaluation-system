const rag = require('widget.dsl');

let clicks = 0;

exports.pages = {
  smoke(ctx) {
    return {
      id: ctx.pageId,
      title: 'Widget Smoke',
      schemaVersion: '0.1.0',
      root: rag.appShell(
        {
          header: rag.panel({ title: 'Widget Smoke Header', density: 'condensed' },
            rag.caption({ tone: 'success' }, 'Embedded app loaded')
          ),
          sidebar: rag.appNav({
            brand: 'Smoke',
            activeItemId: 'smoke',
            items: [{ id: 'smoke', label: 'Smoke' }]
          })
        },
        rag.stack({ gap: 'md' },
          rag.panel({ title: 'Action smoke' },
            rag.statusText({ status: 'success', icon: true }, 'Clicks ' + clicks),
            rag.button({ variant: 'primary', action: { kind: 'server', name: 'increment', payload: { source: 'playwright' } } }, 'Increment')
          ),
          rag.panel({ title: 'Schema smoke' },
            rag.caption({ tone: 'muted' }, 'Schema version 0.1.0')
          )
        )
      )
    };
  }
};

exports.actions = {
  increment(ctx, payload) {
    clicks += 1;
    return {
      ok: true,
      refresh: true,
      toast: 'incremented via ' + payload.source,
      data: { action: ctx.action, clicks }
    };
  }
};
