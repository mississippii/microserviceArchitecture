-- What a seller says about their own offer of a product: photos, a video, a description and the ingredients.
ALTER TABLE listings
    ADD COLUMN description VARCHAR(2000),
    ADD COLUMN ingredients VARCHAR(2000),
    ADD COLUMN image_urls  TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN video_url   VARCHAR(500);
