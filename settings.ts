import AutoLinkTitle from "main";
import {App, PluginSettingTab, Setting, TextAreaComponent} from "obsidian";

export interface AutoLinkTitleSettings {
  regex: RegExp;
  lineRegex: RegExp;
  linkRegex: RegExp;
  linkLineRegex: RegExp;
  imageRegex: RegExp;
  shouldReplaceSelection: boolean;
  addLink: boolean;
  enhanceDefaultPaste: boolean;
  websiteBlacklist: string;
  customRules: string;
}

export const DEFAULT_SETTINGS: AutoLinkTitleSettings = {
  regex:
    /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/i,
  lineRegex:
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
  linkRegex:
    /^\[([^\[\]]*)\]\((https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})\)$/i,
  linkLineRegex:
    /\[([^\[\]]*)\]\((https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})\)/gi,
  imageRegex: /\.(gif|jpe?g|tiff?|png|webp|bmp|tga|psd|ai)$/i,
  shouldReplaceSelection: true,
  addLink: true,
  enhanceDefaultPaste: true,
  websiteBlacklist: "",
  customRules: ""
};

export class AutoLinkTitleSettingTab extends PluginSettingTab {
  plugin: AutoLinkTitle;

  constructor(app: App, plugin: AutoLinkTitle) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let {containerEl} = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Enhance Default Paste")
      .setDesc(
        "Fetch the link title when pasting a link in the editor with the default paste command"
      )
      .addToggle((val) =>
        val
          .setValue(this.plugin.settings.enhanceDefaultPaste)
          .onChange(async (value) => {
            console.log(value);
            this.plugin.settings.enhanceDefaultPaste = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Replace Selection")
      .setDesc(
        "Whether to replace a text selection with link and fetched title"
      )
      .addToggle((val) =>
        val
          .setValue(this.plugin.settings.shouldReplaceSelection)
          .onChange(async (value) => {
            console.log(value);
            this.plugin.settings.shouldReplaceSelection = value;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.shouldReplaceSelection) {
      new Setting(containerEl)
        .setName("add Link")
        .setDesc(
          "add link for selection"
        )
        .setClass("setting-indent")
        .addToggle((val) =>
          val
            .setValue(this.plugin.settings.addLink)
            .onChange(async (value) => {
              console.log(value);
              this.plugin.settings.addLink = value;
              await this.plugin.saveSettings();
              this.display();
            })
        );
    }

    new Setting(containerEl)
      .setName("Website Blacklist")
      .setDesc(
        "List of strings (comma separated) that disable autocompleting website titles. Can be URLs or arbitrary text."
      )
      .addTextArea((val) =>
        val
          .setValue(this.plugin.settings.websiteBlacklist)
          .setPlaceholder("localhost, tiktok.com")
          .onChange(async (value) => {
            this.plugin.settings.websiteBlacklist = value;
            await this.plugin.saveSettings();
          })
      );

    let customRulesSetting = new Setting(containerEl)
      .setName("Website Custom Rules")
      .setDesc(
        "custom get title rules, like url,selector,[attr|content], val(if last arg is attr)"
      );

    customRulesSetting.settingEl.setAttribute(
      "style",
      "display: grid; grid-template-columns: 1fr;"
    );

    const customRulesComponent = new TextAreaComponent(
      customRulesSetting.controlEl
    );

    setAttributes(customRulesComponent.inputEl, {
      style: "margin-top: 12px; width: 100%;  height: 30vh;",
    });


    customRulesComponent
      .setValue(this.plugin.settings.customRules)
      .setPlaceholder("url,selector,attr|content, val")
      .onChange(async (value) => {
        this.plugin.settings.customRules = value;
        await this.plugin.saveSettings();
      })

  }
}

function setAttributes(element: any, attributes: any) {
  for (let key in attributes) {
    element.setAttribute(key, attributes[key]);
  }
}
