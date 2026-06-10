---
title: _STYLE-GUIDE
date: 2025-06-10
tags: [meta]
---

copy-paste from here when writing posts.

---

## ASCII art

<pre class="ascii-art">
      ┌─┐       ┌─┐
      │ │       │ │
      │ │       │ │
      │ │       │ │
      └─┘       └─┘
</pre>

## Colored text

<span class="c-accent">accent</span>
<span class="c-green">green</span>
<span class="c-amber">amber</span>
<span class="c-red">red</span>
<span class="c-dim">dim</span>
<span class="c-bright">bright</span>

## Glitch

<span class="glitch-simple">glitching text</span>

→ full glitch (needs data-text):

<span class="glitch" data-text="glitch">glitch</span>

## Highlight

<mark class="highlight">highlighted text</mark>

## Horizontal rules

regular:

---

hr-dots:

<hr class="hr-dots" />

hr-glitch:

<hr class="hr-glitch" />

hr-thin:

<hr class="hr-thin" />

## Callout blocks

> [!NOTE]
> a note — amber left border

> [!WARNING]
> watch out — amber border, darker bg

> [!DANGER]
> this is serious — red border, red bg

## Code blocks

```js
function hello() {
  console.log('syntax highlighted');
}
```

inline `code` too

## Images

![dump](/assets/Dump/jpeg.jpeg)

→ wide variant:

<img class="blog-image-wide" src="/assets/Dump/jpeg.jpeg" alt="wide" />

→ borderless variant:

<img class="blog-image-borderless" src="/assets/Dump/jpeg.jpeg" alt="no border" />

(click any image to open in lightbox)
