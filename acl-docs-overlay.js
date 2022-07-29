/* Constant globals */
const numberOfNavColumns = 4;

/* Remove all left tabs, use margin instead*/
let doc = document.querySelector("pre");
doc.textContent = doc.textContent.replace(/\n(\t| {7})/g, "\n");

/* Move content into main */
document.body.innerHTML = `<main><div>${document.body.innerHTML}</div></main>`;

/* Get commands and link them */
// Yes, I know this is already defined above, but removing this breaks things...
doc = document.querySelector("pre");
const commandSection = /(-{79}\s+)(\w+)( : )([\w\W]+?\n(?=-))/g;

const commandSections = [...doc.textContent.matchAll(commandSection)];

let resultDoc = doc.textContent;

commandSections.forEach((commandSectionMatch) => {
  const reg = new RegExp(
    `(-{79}\\s+)(${commandSectionMatch[2]})( : [\\w\\W]+?\\n(?=-))`
  );
  resultDoc = resultDoc.replace(reg, '$1<section id="$2">$2$3</section>\n');
});

doc.innerHTML = resultDoc;

/* Append new CSS to head */
// Create the style element
function createStyleElement(id, content) {
  const style = document.createElement("style");
  style.type = "text/css";
  style.id = id;

  if (style.styleSheet) {
    style.styleSheet.cssText = content;
  } else {
    style.appendChild(document.createTextNode(content));
  }
  return style;
}

// Appends CSS content to the head of the site
function appendStyleSheet(id, content) {
  if (!document.querySelector("#" + id)) {
    const head = document.head || document.getElementsByTagName("head")[0];
    head.appendChild(createStyleElement(id, content));
  }
}

// Much of the design of the table of contents comes from this example
// https://codepen.io/bramus/pen/ExaEqMJ
// The content of the stylesheet
const styleSheetContent = `
    /* 1. Enable smooth scrolling */
    html {
        scroll-behavior: smooth;
    }

    /* 2. Make nav sticky */
    main > nav {
        position: sticky;
        top: 2rem;
        align-self: start;
    }

    /* 3. ScrollSpy active styles (see JS tab for activation) */
    .section-nav li.active > a {
        color: #333;
        font-weight: 500;
    }

    /* Sidebar Navigation */
    .section-nav {
        padding-left: 0;
        border-left: 1px solid #efefef;
        font-size: small;
    }

    .section-nav a {
        text-decoration: none;
        display: block;
        padding: .125rem 0;
        color: #ccc;
        transition: all 50ms ease-in-out; /* 💡 This small transition makes setting of the active state smooth */
    }

    .section-nav a:hover,
    .section-nav a:focus {
        color: #666;
    }

    /** Poor man's reset **/
    * {
        box-sizing: border-box;
    }

    html, body {
        background: #fff;
    }

    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    }

    ul, ol {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    li {
        margin-left: 1rem;
    }

    h1 {
        font-weight: 300;
    }

    /** page layout **/
    main {
        display: grid;
        grid-template-columns: 1fr repeat(${numberOfNavColumns}, 10rem);
        max-width: 100em;
        width: 95%;
        margin: 0 auto;
    }

    /** search bar **/
    input {
        position: fixed;
        bottom: 2rem;
        margin-left: 1rem;
        height: 2rem;
        width: 80ex;
        border-color: #efefef;
        box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2),
                    0px 1px 1px 0px rgba(0, 0, 0, 0.14),
                    0px 1px 3px 0px rgba(0,0,0,.12);
        border-width: 1px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 1rem;
    }
`;

appendStyleSheet("demo", styleSheetContent);

/* Build the table of contents from the commands above */
/*
    <nav class="section-nav">
        <ol>
            <li><a href="#introduction">Introduction</a></li>
            <li><a href="#request-response">Request &amp; Response</a></li>
            <li><a href="#authentication">Authentication</a></li>
            <li><a href="#links">Links</a></li>
            <li><a href="#expanders">Expanders</a></li>
            <li><a href="#filters">Filters</a></li>
        </ol>
    </nav>
*/

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#examples
const sortByIndex = (index) => {
  return (a, b) => {
    return a[index] > b[index] ? 1 : a[index] < b[index] ? -1 : 0;
  };
};

const sortedCommandSections = commandSections.sort(sortByIndex(2));

for (let column = 0; column < numberOfNavColumns; column++) {
  const nav = document.createElement("nav");
  nav.className = "section-nav";
  const ol = document.createElement("ol");
  const commandsPerColumn = sortedCommandSections.length / numberOfNavColumns;
  const startIndex = Math.ceil(column * commandsPerColumn);

  for (
    let index = startIndex;
    index < commandsPerColumn * (column + 1);
    index++
  ) {
    const commandSectionMatch = sortedCommandSections[index];
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${commandSectionMatch[2]}`;
    a.textContent = commandSectionMatch[2];
    li.appendChild(a);
    ol.appendChild(li);
  }

  nav.appendChild(ol);
  document.querySelector("main").appendChild(nav);
}

/* "watch" the links and update the table of contents based on our location */
// This observer example is stolen from this example
// https://codepen.io/bramus/pen/ExaEqMJ
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const id = entry.target.getAttribute("id");
    if (entry.intersectionRatio > 0) {
      document
        .querySelector(`nav li a[href="#${id}"]`)
        .parentElement.classList.add("active");
    } else {
      document
        .querySelector(`nav li a[href="#${id}"]`)
        .parentElement.classList.remove("active");
    }
  });
});

// Track all sections that have an `id` applied
document.querySelectorAll("section[id]").forEach((section) => {
  observer.observe(section);
});

/* Add splice to String prototype */
// https://stackoverflow.com/a/4314050/2271815
String.prototype.splice = function (start, delCount, newSubStr) {
  return (
    this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount))
  );
};

/* Add section search bar */
const input = document.createElement("input");
input.type = "search";
input.placeholder = "Search in current view...";
document.querySelector("main div").appendChild(input);
let markedNodes = [];

document.addEventListener("change", (event) => {
  markedNodes.forEach((node) => (node.innerHTML = node.textContent));
  markedNodes = [];

  if (event.target.value === "") {
    console.log("empty value!");
    return;
  }

  const activeSectionTitles = document.querySelectorAll("nav li.active");
  Array.from(activeSectionTitles).map((node) => {
    const section = document.querySelector(`section#${node.textContent}`);
    markedNodes.push(section);

    const matches = section.textContent.matchAll(
      new RegExp(event.target.value, "g")
    );
    let markedText = section.textContent;

    Array.from(matches)
      .reverse()
      .forEach((match) => {
        const startIndex = match["index"];
        const endIndex = startIndex + event.target.value.length;
        markedText = markedText
          .splice(endIndex, 0, "</mark>")
          .splice(startIndex, 0, "<mark>");
      });

    section.innerHTML = markedText;
  });
});
