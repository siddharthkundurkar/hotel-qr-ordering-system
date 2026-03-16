export const getCroppedImage = async (
  imageSrc,
  pixelCrop,
  width = 512,
  height = 512
) => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((r) => (image.onload = r));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(
          new File([blob], "menu-image.jpg", {
            type: "image/jpeg",
          })
        );
      },
      "image/jpeg",
      0.9
    );
  });
};
