CREATE TABLE [dbo].[BusinessShift] (
  [id] NVARCHAR(36) NOT NULL,
  [businessId] NVARCHAR(36) NOT NULL,
  [memberKey] NVARCHAR(36) NOT NULL,
  [date] NVARCHAR(10) NOT NULL,
  [startTime] NVARCHAR(5),
  [endTime] NVARCHAR(5),
  CONSTRAINT [BusinessShift_pkey] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [BusinessShift_businessId_fkey] FOREIGN KEY ([businessId]) REFERENCES [dbo].[Business]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE UNIQUE NONCLUSTERED INDEX [BusinessShift_businessId_memberKey_date_key] ON [dbo].[BusinessShift]([businessId], [memberKey], [date]);
