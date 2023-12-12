import {requestUrl} from 'obsidian'

function blank(text: string): boolean {
  return text === undefined || text === null || text === ''
}

function notBlank(text: string): boolean {
  return !blank(text)
}

async function scrape(url: string): Promise<string> {
  try {
    const response = await requestUrl(url)
    if (!response.headers['content-type'].includes('text/html')) return getUrlFinalSegment(url)
    const html = response.text

    const doc = new DOMParser().parseFromString(html, 'text/html')

    // match url, get titleExtractor
    // titleExtractor.extract(doc)


    const title = doc.querySelector('title')

    if (blank(title?.innerText)) {
      // If site is javascript based and has a no-title attribute when unloaded, use it.
      var noTitle = title?.getAttr('no-title')
      if (notBlank(noTitle)) {
        return noTitle
      }

      // Otherwise if the site has no title/requires javascript simply return Title Unknown
      return url
    }

    return title.innerText
  } catch (ex) {
    console.error(ex)
    return 'Site Unreachable'
  }
}

function getUrlFinalSegment(url: string): string {
  try {
    const segments = new URL(url).pathname.split('/')
    const last = segments.pop() || segments.pop() // Handle potential trailing slash
    return last
  } catch (_) {
    return 'File'
  }
}

export default async function getPageTitle(url: string) {
  if (!(url.startsWith('http') || url.startsWith('https'))) {
    url = 'https://' + url
  }

  return scrape(url)
}

export class TitleExtractor {

  private readonly selector: string;
  private readonly type: string;
  private readonly key: string;

  constructor(selector: string, type: string, key: string) {

    this.selector = selector;
    this.type = type;
    this.key = key;
  }

  extract(doc: Document): string {
    let element = doc.querySelector(this.selector);
    if (this.type === "attr") {
      return element.getAttr(this.key);
    } else {
      return element.textContent;
    }
  }
}

class DefaultExtractor extends TitleExtractor {

  extract(doc: Document): string {
    const title = doc.querySelector('title')

    if (blank(title?.innerText)) {
      // If site is javascript based and has a no-title attribute when unloaded, use it.
      const noTitle = title?.getAttr('no-title')
      if (notBlank(noTitle)) {
        return noTitle
      }
    }

    return title.innerText
  }
}

const defaultExtractor = new DefaultExtractor("", "", "");

export class TitleExtractorManager {

  private readonly map: Map<string, TitleExtractor>

  constructor(rules: string) {

    this.map = new Map<string, TitleExtractor>();
    for (const rule of rules.split(";")) {
      let segments = rule.split(",");
      const domain = segments[0];
      const selector = segments[1];
      const type = segments[2];
      const key = segments[3]
      this.map.set(domain, new TitleExtractor(selector, type, key))
    }
  }

  async get(url: string): Promise<string> {

    if (!(url.startsWith('http') || url.startsWith('https'))) {
      url = 'https://' + url
    }

    try {
      const response = await requestUrl(url)
      if (!response.headers['content-type'].includes('text/html')) return getUrlFinalSegment(url)
      const html = response.text

      const doc = new DOMParser().parseFromString(html, 'text/html')

      // match url, get titleExtractor
      // titleExtractor.extract(doc)
      const extractor = this.getExtractor(url);
      const title = extractor.extract(doc);
      if (blank(title)) {
        // Otherwise if the site has no title/requires javascript simply return Title Unknown
        return url
      }
      return title
    } catch (ex) {
      console.error(ex)
      return 'Site Unreachable'
    }
  }

  private getExtractor(url: string): TitleExtractor {

    for (const key of this.map.keys()) {
      if (url.contains(key)) {
        return this.map.get(key);
      }
    }
    return defaultExtractor;
  }
}