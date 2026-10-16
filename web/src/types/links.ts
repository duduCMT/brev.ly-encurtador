export type ILink = {
  id: string;
  originalUrl: string;
  shortUrl: string;
  clicks?: number;
  createdAt: string;
};

export type LinksListItemProps = {
  link: ILink;
};

export type LinksSkeletonProps = {
  rows?: number;
};
