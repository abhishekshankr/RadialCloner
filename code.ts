figma.showUI(__html__, { width: 240, height: 280 });

async function loadSavedData() {
  // Load saved data from client storage
  const numberOfCopies = await figma.clientStorage.getAsync('numberOfCopies') || 8;
  const circleWidth = await figma.clientStorage.getAsync('circleWidth') || 400;
  const tangential = await figma.clientStorage.getAsync('tangential')? true : false;

  // Send the saved data to the UI
  figma.ui.postMessage({ type: 'load-saved-data', data: { numberOfCopies, circleWidth, tangential } });
}

loadSavedData();

figma.ui.onmessage = async (msg) => {
  if (msg.type === "create-copies") {
    const { numberOfCopies, circleWidth, tangential } = msg;
    const nodes = figma.currentPage.selection;

    figma.clientStorage.setAsync('numberOfCopies', numberOfCopies);
    figma.clientStorage.setAsync('circleWidth', circleWidth);
    figma.clientStorage.setAsync('tangential', tangential);

    if (nodes.length === 1) {
      const node = nodes[0];
      const layerName = node.name;
      const initialGroup = figma.group([node], figma.currentPage);

      createCopiesInCircle(initialGroup, numberOfCopies, circleWidth, tangential);

      initialGroup.parent?.appendChild(initialGroup.children[0]);
      

      figma.notify(`New Radial created for "${layerName}"`);
      
      figma.closePlugin();

    } else {
      figma.notify("Please select a single object");
    }
  }
};

  function createCopiesInCircle(
    node: SceneNode,
    numberOfCopies: number,
    circleWidth: number,
    tangential: boolean
  ) {
    const angle = (2 * Math.PI) / numberOfCopies;
    const radius = (circleWidth) / 2;
    const copies = [];

    for (let i = 0; i < numberOfCopies; i++) {
      const copy = node.clone();

      const x = node.x - radius * Math.cos(angle * i);
      const y = node.y - radius * Math.sin(angle * i);
      copy.x = x;
      copy.y = y;

      // Rotate tangentially
      if (tangential) {
        const rotationAngle = (angle * i) - Math.PI / 2;
        let theta = rotationAngle;

        
        let cx = copy.x + copy.width / 2;
        let cy = copy.y + copy.height / 2;

        const newX = cx + (copy.x - cx) * Math.cos(theta) - (copy.y - cy) * Math.sin(theta);
        const newY = cy + (copy.x - cx) * Math.sin(theta) + (copy.y - cy) * Math.cos(theta);

        copy.relativeTransform = [
          [Math.cos(theta), -Math.sin(theta), 0],
          [Math.sin(theta), Math.cos(theta), 0]
        ];

        copy.x = newX - copy.width / 2;
        copy.y = newY - copy.height / 2;
      }

      // Assign incremental names
      copy.name = `${node.name} Copy ${i + 1}`;

      // Add copy to the copies array and the currentPage
      copies.push(copy);
      figma.currentPage.appendChild(copy);
    }

    // Create a group with all the copies
    const radialGroup = figma.group(copies, figma.currentPage);
    radialGroup.name = "Radial";

    //Ungroup the groups for the radial group
    ungroupChildren(radialGroup);


  // Zoom the screen to fit the radial group
  figma.viewport.scrollAndZoomIntoView([radialGroup]);
}

  function ungroupChildren(parentGroup: GroupNode) {
    const childrenToUngroup = parentGroup.children.slice();
    for (const child of childrenToUngroup) {
      const group = child as GroupNode;
      const groupChildren = group.children.slice();
      for (const groupChild of groupChildren) {
        parentGroup.appendChild(groupChild);
      }
    }
  }