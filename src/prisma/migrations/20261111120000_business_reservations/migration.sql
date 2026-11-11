BEGIN TRY
BEGIN TRAN;
CREATE TABLE [dbo].[BusinessReservation] (
  [id] NVARCHAR(36) NOT NULL,
  [requestId] NVARCHAR(36) NOT NULL,
  [businessId] NVARCHAR(36) NOT NULL,
  [customerId] NVARCHAR(1000) NOT NULL,
  [status] NVARCHAR(24) NOT NULL,
  [firstVisit] BIT NOT NULL,
  [note] NVARCHAR(1000),
  [total] INT NOT NULL,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [BusinessReservation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT [BusinessReservation_pkey] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [BusinessReservation_total_check] CHECK ([total] >= 0)
);
CREATE TABLE [dbo].[BusinessReservationItem] (
  [id] NVARCHAR(36) NOT NULL,
  [reservationId] NVARCHAR(36) NOT NULL,
  [memberKey] NVARCHAR(36) NOT NULL,
  [serviceId] NVARCHAR(36) NOT NULL,
  [serviceName] NVARCHAR(255) NOT NULL,
  [position] INT NOT NULL,
  [startsAt] DATETIME2 NOT NULL,
  [endsAt] DATETIME2 NOT NULL,
  [price] INT NOT NULL,
  CONSTRAINT [BusinessReservationItem_pkey] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [BusinessReservationItem_times_check] CHECK ([endsAt] > [startsAt]),
  CONSTRAINT [BusinessReservationItem_price_check] CHECK ([price] >= 0)
);
CREATE UNIQUE NONCLUSTERED INDEX [BusinessReservation_requestId_key] ON [dbo].[BusinessReservation]([requestId]);
CREATE NONCLUSTERED INDEX [BusinessReservation_businessId_status_idx] ON [dbo].[BusinessReservation]([businessId], [status]);
CREATE UNIQUE NONCLUSTERED INDEX [BusinessReservationItem_reservationId_position_key] ON [dbo].[BusinessReservationItem]([reservationId], [position]);
CREATE NONCLUSTERED INDEX [BusinessReservationItem_memberKey_startsAt_endsAt_idx] ON [dbo].[BusinessReservationItem]([memberKey], [startsAt], [endsAt]);
ALTER TABLE [dbo].[BusinessReservation] ADD CONSTRAINT [BusinessReservation_businessId_fkey] FOREIGN KEY ([businessId]) REFERENCES [dbo].[Business]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[BusinessReservation] ADD CONSTRAINT [BusinessReservation_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[BusinessReservationItem] ADD CONSTRAINT [BusinessReservationItem_reservationId_fkey] FOREIGN KEY ([reservationId]) REFERENCES [dbo].[BusinessReservation]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;
COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
