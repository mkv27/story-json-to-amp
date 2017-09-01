/* @flow */

import format from './format';
import { renderCSS } from './render-css';
import renderTag from './render-tag';
import componentToHtmlTagMap from './component-to-html-tag';
import type { StoryType } from './types';

const ampElementScriptsMap = {
  video: '<script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>',
};

const renderAmpElementScripts = elementsMap => Object.keys(elementsMap)
  .map(element => ampElementScriptsMap[element])
  .join('\n');

const renderTextElement = tagName => ({ text, ...props }) => renderTag(tagName, props, text);

const textElements = [
  'heading',
  'heading1',
  'heading2',
  'heading3',
  'heading4',
  'heading5',
  'heading6',
  'paragraph',
];

export default ({ title, defaultStyles, pages, canonicalUrl }: StoryType) => {
  const ampElementsThatNeedScripts = {};

  const elementTypeToRenderMap = {
    ...textElements.reduce((accum, componentName) => ({
      ...accum,
      [componentName]: renderTextElement(componentToHtmlTagMap[componentName]),
    }), {}),
    container: ({ elements, ...props }) => renderTag(
      componentToHtmlTagMap.container,
      props,
      elements.map(element => renderElement(element)).join(''),    // eslint-disable-line no-use-before-define
    ),
    image: props => renderTag(componentToHtmlTagMap.image, props),
    video: ({ sources, ...props }) => {
      ampElementsThatNeedScripts.video = true;

      return renderTag(
        componentToHtmlTagMap.video,
        props,
        sources.map(({ source, type }) => renderTag('source', { source, type: `video/${type}` })).join(''),
      );
    },
  };

  const renderElement = ({ type, ...layer }) => elementTypeToRenderMap[type](layer);

  const renderAmpStoryGridLayer = (template, children) => renderTag(
    'amp-story-grid-layer',
    { template },
    children,
  );
  const layerTemplateToRenderMap = {
    fill: ({ element }) => renderAmpStoryGridLayer('fill', renderElement(element)),
    vertical: ({ elements }) => renderAmpStoryGridLayer(
      'vertical',
      elements.map(element => renderElement(element)).join(''),
    ),
    horizontal: ({ elements }) => renderAmpStoryGridLayer(
      'horizontal',
      elements.map(element => renderElement(element)).join(''),
    ),
    thirds: ({ elements }) => renderAmpStoryGridLayer(
      'thirds',
      elements.map((element, thirdIndex) => renderElement({ ...element, thirdIndex })).join(''),
    ),
  };

  const renderPage = ({ id, layers }) => renderTag(
    'amp-story-page',
    { id },
    layers.map(({ template, ...layer }) => layerTemplateToRenderMap[template](layer)).join(''),
  );

  const renderStory = storyPages => renderTag('amp-story', {}, storyPages.map(renderPage).join(''));

  // This has to happen first so that ampElementsThatNeedScripts will be filled
  const renderedStory = renderStory(pages);

  return format(`<!doctype html>
  <html amp amp-story lang="en">
    <head>
      <meta charset="utf-8">
      <script async src="https://stamp-prototype.appspot.com/v0.js"></script>
      <script async custom-element="amp-story" src="https://stamp-prototype.appspot.com/v0/amp-story-0.1.js"></script>
      ${renderAmpElementScripts(ampElementsThatNeedScripts)}
      <title>${title}</title>
      <link rel="canonical" href="${canonicalUrl}" />
      <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
      <style amp-boilerplate>
        body {
          -webkit-animation: -amp-start 8s steps(1, end) 0s 1 normal both;
          -moz-animation: -amp-start 8s steps(1, end) 0s 1 normal both;
          -ms-animation: -amp-start 8s steps(1, end) 0s 1 normal both;
          animation: -amp-start 8s steps(1, end) 0s 1 normal both;
        }
        @-webkit-keyframes -amp-start {
          from {
            visibility: hidden;
          }
          to {
            visibility: visible;
          }
        }
        @-moz-keyframes -amp-start {
          from {
            visibility: hidden;
          }
          to {
            visibility: visible;
          }
        }
        @-ms-keyframes -amp-start {
          from {
            visibility: hidden;
          }
          to {
            visibility: visible;
          }
        }
        @-o-keyframes -amp-start {
          from {
            visibility: hidden;
          }
          to {
            visibility: visible;
          }
        }
        @keyframes -amp-start {
          from {
            visibility: hidden;
          }
          to {
            visibility: visible;
          }
        }
      </style>
      <noscript>
        <style amp-boilerplate>
          body {
            -webkit-animation: none;
            -moz-animation: none;
            -ms-animation: none;
            animation: none;
          }
        </style>
      </noscript>
      <style>
        ${renderCSS(defaultStyles)}
      </style>
    </head>
    <body>
      ${renderedStory}
    </body>
  </html>`);
};