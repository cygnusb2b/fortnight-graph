const faker = require('faker');

const html = `
{{!-- Load More Template Style --}}

<div class="item" data-bvo-width="33" data-bvo-item-id="{{ campaign.id }}" data-bvo-item-type="platform-content">

  {{#if creative.image}}
    <div class="element" data-bvo-type="field.image" data-bvo-value-wrap-element="span" data-bvo-linkable="true" data-bvo-width="100"
      data-bvo-position="left" data-bvo-param-field-key="primaryImage" data-bvo-param-fallback-keys="" data-bvo-param-convert-breaks="false"
      data-bvo-param-filter="" data-bvo-param-is-fragment="false" data-bvo-param-fragment-url="" data-bvo-param-aspect-ratio="16:9"
      data-bvo-param-fit="contain" data-bvo-template-name="platform-content.primary-image">
      <a href="{{ campaign.url }}"
        title="{{ creative.title }}" target="_self">
        <noscript>
          <img class="img-responsive" src="{{ creative.image.src }}"
            alt="{{ creative.image.alt }}" title="{{ creative.image.alt }}" style="opacity:1;">
        </noscript>
        <img id="{{ creative.image.id }}" class="img-responsive" data-bvo-src="{{ creative.image.src }}"
          alt="{{ creative.image.alt }}" title="{{ creative.image.alt }}">
      </a>
    </div>
  {{/if}}

  <div class="element" data-bvo-type="group" data-bvo-value-wrap-element="span" data-bvo-linkable="false" data-bvo-width="100"
    data-bvo-position="left">
    <div class="element" data-bvo-type="field" data-bvo-value-wrap-element="h3" data-bvo-linkable="true" data-bvo-width="100"
      data-bvo-position="left" data-bvo-param-field-key="shortName" data-bvo-param-fallback-keys="nameWebsite,name" data-bvo-param-convert-breaks="false"
      data-bvo-param-filter="" data-bvo-param-is-fragment="false" data-bvo-param-fragment-url="" data-bvo-template-name="platform-content.shortName">
      <a href="{{ campaign.url }}"
        title="{{ creative.title }}" target="_self">
        <h3 class="value" data-bvo-item-id="{{ campaign.id }}" data-bvo-item-type="platform-content">
          {{ creative.title }}
        </h3>
      </a>
    </div>


    <div class="element" data-bvo-type="field" data-bvo-value-wrap-element="span" data-bvo-linkable="false" data-bvo-width="100"
      data-bvo-position="left" data-bvo-param-field-key="teaserWebsite" data-bvo-param-fallback-keys="teaser" data-bvo-param-convert-breaks="false"
      data-bvo-param-filter="" data-bvo-param-is-fragment="false" data-bvo-param-fragment-url="" data-bvo-template-name="platform-content.teaser">
      <span class="value" data-bvo-item-id="{{ campaign.id }}" data-bvo-item-type="platform-content">
        {{ creative.teaser }}
      </span>
    </div>

    <div class="element" data-bvo-type="group" data-bvo-value-wrap-element="span" data-bvo-linkable="false" data-bvo-width="100"
      data-bvo-position="left" data-bvo-template-name="platform-content.tag+published">
      <div class="element" data-bvo-type="field" data-bvo-value-wrap-element="span" data-bvo-linkable="true" data-bvo-width="0"
        data-bvo-position="left" data-bvo-param-field-key="primarySectionWebsite.name" data-bvo-param-fallback-keys="" data-bvo-param-convert-breaks="false"
        data-bvo-param-filter="" data-bvo-param-is-fragment="false" data-bvo-param-fragment-url="" data-bvo-template-name="platform-content.website-section-tag">
        {{!-- <a href="/tactical/tactical-medical" title="Tactical Medical" target="_self">
          <span class="value" data-bvo-item-id="57664" data-bvo-item-type="website-section">
            Tactical Medical
          </span>
        </a> --}}
      </div>

      <div class="element" data-bvo-type="field.date" data-bvo-value-wrap-element="span" data-bvo-linkable="false" data-bvo-width="0"
        data-bvo-position="left" data-bvo-param-field-key="published" data-bvo-param-fallback-keys="created" data-bvo-param-convert-breaks="false"
        data-bvo-param-filter="" data-bvo-param-is-fragment="false" data-bvo-param-fragment-url="" data-bvo-param-format="ap:mdy"
        data-bvo-template-name="platform-content.published-date">
        <span class="value" data-bvo-item-id="{{ campaign.id }}" data-bvo-item-type="platform-content">
          {{#if campaign.createdAt}}{{moment-format campaign.createdAt 'MMM D, YYYY'}}{{/if}}
        </span>
      </div>
    </div>
  </div>
</div>
`;

const fallback = `
{{!-- Load More Template Style --}}

<div class="item" data-bvo-width="33" data-bvo-item-id="{{ contentId }}" data-bvo-item-type="platform-content">

  {{#if image.src}}
    <div class="element" data-bvo-type="field.image" data-bvo-value-wrap-element="span" data-bvo-linkable="true" data-bvo-width="100"
      data-bvo-position="left" data-bvo-param-field-key="primaryImage" data-bvo-param-fallback-keys="" data-bvo-param-convert-breaks="false"
      data-bvo-param-filter="" data-bvo-param-is-fragment="false" data-bvo-param-fragment-url="" data-bvo-param-aspect-ratio="16:9"
      data-bvo-param-fit="contain" data-bvo-template-name="platform-content.primary-image">
      <a href="{{ url }}"
        title="{{ title }}" target="_self">
        <noscript>
          <img class="img-responsive" src="{{ image.src }}"
            alt="{{ image.alt }}" title="{{ image.alt }}" style="opacity:1;">
        </noscript>
        <img id="{{ image.id }}" class="img-responsive" data-bvo-src="{{ image.src }}"
          alt="{{ image.alt }}" title="{{ image.alt }}">
      </a>
    </div>
  {{/if}}

  <div class="element" data-bvo-type="group" data-bvo-value-wrap-element="span" data-bvo-linkable="false" data-bvo-width="100"
    data-bvo-position="left">
    <div class="element" data-bvo-type="field" data-bvo-value-wrap-element="h3" data-bvo-linkable="true" data-bvo-width="100"
      data-bvo-position="left" data-bvo-param-field-key="shortName" data-bvo-param-fallback-keys="nameWebsite,name" data-bvo-param-convert-breaks="false"
      data-bvo-param-filter="" data-bvo-param-is-fragment="false" data-bvo-param-fragment-url="" data-bvo-template-name="platform-content.shortName">
      <a href="{{ url }}"
        title="{{ title }}" target="_self">
        <h3 class="value" data-bvo-item-id="{{ contentId }}" data-bvo-item-type="platform-content">
          {{ title }}
        </h3>
      </a>
    </div>


    <div class="element" data-bvo-type="field" data-bvo-value-wrap-element="span" data-bvo-linkable="false" data-bvo-width="100"
      data-bvo-position="left" data-bvo-param-field-key="teaserWebsite" data-bvo-param-fallback-keys="teaser" data-bvo-param-convert-breaks="false"
      data-bvo-param-filter="" data-bvo-param-is-fragment="false" data-bvo-param-fragment-url="" data-bvo-template-name="platform-content.teaser">
      <span class="value" data-bvo-item-id="{{ contentId }}" data-bvo-item-type="platform-content">
        {{ teaser }}
      </span>
    </div>

    <div class="element" data-bvo-type="group" data-bvo-value-wrap-element="span" data-bvo-linkable="false" data-bvo-width="100"
      data-bvo-position="left" data-bvo-template-name="platform-content.tag+published">
      <div class="element" data-bvo-type="field" data-bvo-value-wrap-element="span" data-bvo-linkable="true" data-bvo-width="0"
        data-bvo-position="left" data-bvo-param-field-key="primarySectionWebsite.name" data-bvo-param-fallback-keys="" data-bvo-param-convert-breaks="false"
        data-bvo-param-filter="" data-bvo-param-is-fragment="false" data-bvo-param-fragment-url="" data-bvo-template-name="platform-content.website-section-tag">
        <a href="{{ section.url }}" title="{{ section.name }}" target="_self">
          <span class="value" data-bvo-item-id="{{ section.id }}" data-bvo-item-type="website-section">
            {{ section.name }}
          </span>
        </a>
      </div>

      <div class="element" data-bvo-type="field.date" data-bvo-value-wrap-element="span" data-bvo-linkable="false" data-bvo-width="0"
        data-bvo-position="left" data-bvo-param-field-key="published" data-bvo-param-fallback-keys="created" data-bvo-param-convert-breaks="false"
        data-bvo-param-filter="" data-bvo-param-is-fragment="false" data-bvo-param-fragment-url="" data-bvo-param-format="ap:mdy"
        data-bvo-template-name="platform-content.published-date">
        <span class="value" data-bvo-item-id="{{ contentId }}" data-bvo-item-type="platform-content">
          {{#if publishedDate}}{{moment-format publishedDate 'MMM D, YYYY'}}{{/if}}
        </span>
      </div>
    </div>
  </div>
</div>
`;

module.exports = () => {
  const now = new Date();
  return {
    name: faker.random.words(),
    html,
    fallback,
    createdAt: now,
    updatedAt: now,
  };
};
