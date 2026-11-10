CREATE TABLE [dbo].[BusinessRecurringShift] (
 [id] NVARCHAR(36) NOT NULL,
 [businessId] NVARCHAR(36) NOT NULL,
 [memberKey] NVARCHAR(36) NOT NULL,
 [startDate] NVARCHAR(10) NOT NULL,
 [endDate] NVARCHAR(10),
 [interval] INT NOT NULL,
 [days] NVARCHAR(MAX) NOT NULL,
 CONSTRAINT [BusinessRecurringShift_pkey] PRIMARY KEY CLUSTERED ([id]),
 CONSTRAINT [BusinessRecurringShift_businessId_fkey] FOREIGN KEY ([businessId]) REFERENCES [dbo].[Business]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE UNIQUE NONCLUSTERED INDEX [BusinessRecurringShift_businessId_memberKey_startDate_key] ON [dbo].[BusinessRecurringShift]([businessId],[memberKey],[startDate]);
