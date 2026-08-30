/*
 * SVG adjacency matrix renderer for Programming Studio.
 * Uses the app's shared space IDs and proximityMatrix pair keys.
 */
(function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function stateSymbol(state) {
    if (state === "Primary") return "●";
    if (state === "Secondary") return "○";
    if (state === "Undesired") return "╱";
    return "";
  }

  function createDiagramMarkup(spaces, stateForPair) {
    const longestName = Math.max(12, ...spaces.map((space) => space.name.length));
    const labelWidth = Math.max(130, longestName * 7.5 + 24);
    const rowHeight = 36;
    const cellSize = 20;
    const halfCell = cellSize / 2;
    const count = spaces.length;
    const matrixWidth = count > 1 ? (count - 1) * (rowHeight / 2) + 42 : 42;
    const width = labelWidth + matrixWidth + 156;
    const height = Math.max(78, count * rowHeight + 12);

    const roomRows = spaces.map((space, index) => {
      const y = index * rowHeight + rowHeight / 2;
      return `
        <g class="adjacency-room" data-space-id="${escapeHtml(space.id)}">
          <line x1="0" y1="${y}" x2="${labelWidth}" y2="${y}" />
          <text x="0" y="${y - 7}">${escapeHtml(space.name)}</text>
        </g>
      `;
    }).join("");

    const cells = [];
    spaces.forEach((from, fromIndex) => {
      spaces.slice(fromIndex + 1).forEach((to, offset) => {
        const toIndex = fromIndex + offset + 1;
        const cx = labelWidth + 18 + offset * (rowHeight / 2);
        const cy = fromIndex * rowHeight + rowHeight / 2 + offset * (rowHeight / 2);
        const state = stateForPair(from, to);
        cells.push(`
          <g class="adjacency-cell matrix-${state ? state.toLowerCase() : "blank"}" data-from-id="${escapeHtml(from.id)}" data-to-id="${escapeHtml(to.id)}" data-state="${escapeHtml(state)}" transform="translate(${cx}, ${cy}) rotate(45)" role="button" tabindex="0" aria-label="${escapeHtml(from.name)} and ${escapeHtml(to.name)} adjacency: ${escapeHtml(state || "none")}">
            <rect x="${-halfCell}" y="${-halfCell}" width="${cellSize}" height="${cellSize}" />
            <text transform="rotate(-45)" text-anchor="middle" dominant-baseline="central">${stateSymbol(state)}</text>
          </g>
        `);
      });
    });

    return `
      <svg class="adjacency-matrix-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Interactive adjacency matrix">
        <g class="adjacency-rooms">${roomRows}</g>
        <g class="adjacency-cells">${cells.join("")}</g>
        <g class="adjacency-key" transform="translate(${labelWidth + matrixWidth + 12}, 16)">
          <text x="0" y="0" class="key-symbol primary">●</text><text x="28" y="0">Primary adjacency</text>
          <text x="0" y="28" class="key-symbol secondary">○</text><text x="28" y="28">Secondary adjacency</text>
          <text x="0" y="56" class="key-symbol undesired">╱</text><text x="28" y="56">Undesired adjacency</text>
        </g>
      </svg>
    `;
  }

  window.ProgrammingStudioAdjacencyMatrix = { createDiagramMarkup };
}());
