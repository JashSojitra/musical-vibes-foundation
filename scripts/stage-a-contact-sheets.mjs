import sharp from "sharp";
const dir = "docs/validation/release3-stage-a";
for (const width of [1440, 390]) {
  const tileWidth = width === 1440 ? 720 : 390;
  const tileHeight = width === 1440 ? 500 : 844;
  const frames = await Promise.all(
    [0, 1, 2, 3].map(async (i) => ({
      input: await sharp(`${dir}/${width}-hero-frame-${i}.png`)
        .resize(tileWidth, tileHeight)
        .toBuffer(),
      left: (i % 2) * tileWidth,
      top: Math.floor(i / 2) * tileHeight,
    })),
  );
  await sharp({
    create: {
      width: tileWidth * 2,
      height: tileHeight * 2,
      channels: 3,
      background: "#19191a",
    },
  })
    .composite(frames)
    .jpeg({ quality: 90 })
    .toFile(`${dir}/${width}-motion-contact-sheet.jpg`);
}
